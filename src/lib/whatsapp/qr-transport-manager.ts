import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
  type BaileysEventMap,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import type { WhatsAppTransport, SendResult } from '@/lib/whatsapp/transport-types'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'
import { createServiceClient } from '@/lib/supabase/service'
import fs from 'fs'
import path from 'path'
import os from 'os'

const logger = pino({ level: 'silent' })

interface SessionInfo {
  accountId: string
  socket: WASocket
  status: 'connecting' | 'connected' | 'disconnected'
}

const sessions = new Map<string, SessionInfo>()

function makeSocket(accountId: string, authState: { state: unknown; saveCreds: () => Promise<void> }): WASocket {
  const sock = makeWASocket({
    auth: authState as never,
    printQRInTerminal: true,
    logger,
    syncFullHistory: false,
    markOnlineOnConnect: true,
  })

  async function upsertConfig(accountId: string, values: Record<string, unknown>) {
    const supabase = createServiceClient()
    const { data: existing } = await supabase
      .from('whatsapp_config')
      .select('account_id')
      .eq('account_id', accountId)
      .maybeSingle()
    if (existing) {
      await supabase.from('whatsapp_config').update(values as never).eq('account_id', accountId)
    } else {
      await supabase.from('whatsapp_config').insert({ account_id: accountId, provider: 'qr', ...values } as never)
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    const session = sessions.get(accountId)
    if (!session) return

    if (qr) {
      await upsertConfig(accountId, { qr_code: qr, connection_status: 'connecting' })
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      session.status = 'disconnected'
      await upsertConfig(accountId, { connection_status: 'disconnected' })
      if (shouldReconnect) {
        setTimeout(() => {
          const stored = sessions.get(accountId)
          if (stored) {
            const newSocket = makeSocket(accountId, authState)
            sessions.set(accountId, { accountId, socket: newSocket, status: 'connecting' })
          }
        }, 1000)
      }
    }

    if (connection === 'open') {
      session.status = 'connected'
      await upsertConfig(accountId, { connection_status: 'connected', qr_code: null })
    }
  })

  sock.ev.on('creds.update', () => {
    authState.saveCreds()
  })

  sock.ev.on('messages.upsert', async (m) => {
    for (const msg of m.messages) {
      if (!msg.key.remoteJid || msg.key.fromMe) continue
      const phone = msg.key.remoteJid.replace('@s.whatsapp.net', '')
      const text = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ''
      const supabase = createServiceClient()
      const { data: configs } = await supabase
        .from('whatsapp_config')
        .select('account_id')
        .eq('account_id', accountId)
        .maybeSingle()
      if (!configs) continue
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', phone)
        .eq('account_id', accountId)
        .maybeSingle()
      let contactId: string
      if (existingContact) {
        contactId = existingContact.id
      } else {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({ phone, account_id: accountId, name: phone })
          .select('id')
          .single()
        if (!newContact) continue
        contactId = newContact.id
      }
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contactId)
        .eq('account_id', accountId)
        .maybeSingle()
      let conversationId: string
      if (existingConv) {
        conversationId = existingConv.id
        await supabase
          .from('conversations')
          .update({ last_message_text: text, last_message_at: new Date().toISOString(), unread_count: 0 })
          .eq('id', conversationId)
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ contact_id: contactId, account_id: accountId, last_message_text: text, last_message_at: new Date().toISOString() })
          .select('id')
          .single()
        if (!newConv) continue
        conversationId = newConv.id
      }
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content_text: text,
          sender: 'contact',
          created_at: new Date().toISOString(),
        })
    }
  })

  return sock
}

async function makeAuthState(credsJson: string | null) {
  const dir = path.join(os.tmpdir(), `wacrm-qr-${Date.now()}`)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (credsJson) {
    fs.writeFileSync(path.join(dir, 'creds.json'), credsJson)
  }
  const { state, saveCreds } = await useMultiFileAuthState(dir)
  return { state, saveCreds, dir }
}

export async function connectQR(accountId: string): Promise<void> {
  if (sessions.has(accountId)) return
  const supabase = createServiceClient()
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('auth_state')
    .eq('account_id', accountId)
    .maybeSingle()
  let credsJson: string | null = null
  if (config?.auth_state) {
    try {
      credsJson = decrypt(config.auth_state)
    } catch { }
  }
  const authState = await makeAuthState(credsJson)
  const socket = makeSocket(accountId, authState)
  sessions.set(accountId, { accountId, socket, status: 'connecting' })
  socket.ev.on('creds.update', async () => {
    try {
      const saved = fs.readFileSync(path.join(authState.dir, 'creds.json'), 'utf-8')
      const encrypted = encrypt(saved)
      const s = createServiceClient()
      const { data: existing } = await s
        .from('whatsapp_config')
        .select('account_id')
        .eq('account_id', accountId)
        .maybeSingle()
      if (existing) {
        await s.from('whatsapp_config').update({ auth_state: encrypted }).eq('account_id', accountId)
      } else {
        await s.from('whatsapp_config').insert({ account_id: accountId, provider: 'qr', auth_state: encrypted })
      }
    } catch (err) {
      console.error('[QR] Failed to persist creds:', err)
    }
  })
}

export async function disconnectQR(accountId: string): Promise<void> {
  const session = sessions.get(accountId)
  if (session) {
    session.socket.logout()
    session.socket.end(undefined)
    sessions.delete(accountId)
  }
  const supabase = createServiceClient()
  await supabase
    .from('whatsapp_config')
    .update({ connection_status: 'disconnected', qr_code: null })
    .eq('account_id', accountId)
}

export function getQRStatus(accountId: string): { status: string } {
  const session = sessions.get(accountId)
  if (!session) return { status: 'disconnected' }
  return { status: session.status }
}

export class QRTransport implements WhatsAppTransport {
  readonly provider = 'qr' as const

  constructor(private readonly accountId: string) {}

  async sendText(opts: { to: string; text: string }): Promise<SendResult> {
    const session = sessions.get(this.accountId)
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp QR not connected')
    }
    const jid = `${opts.to}@s.whatsapp.net`
    const result = await session.socket.sendMessage(jid, { text: opts.text })
    if (!result) throw new Error('sendMessage returned undefined')
    return { messageId: result.key.id || 'unknown' }
  }

  async sendMedia(opts: { to: string; kind: string; link: string; caption?: string }): Promise<SendResult> {
    const session = sessions.get(this.accountId)
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp QR not connected')
    }
    const jid = `${opts.to}@s.whatsapp.net`
    const content: Record<string, unknown> = { url: opts.link }
    if (opts.caption) content.caption = opts.caption
    const result = await session.socket.sendMessage(jid, content as never)
    if (!result) throw new Error('sendMessage returned undefined')
    return { messageId: result.key.id || 'unknown' }
  }

  async sendTemplate(): Promise<SendResult> {
    throw new Error('Templates not supported on QR provider')
  }

  async sendReaction(): Promise<SendResult> {
    throw new Error('Reactions not supported on QR provider')
  }

  async ping(): Promise<boolean> {
    const session = sessions.get(this.accountId)
    return !!session && session.status === 'connected'
  }
}
