import type { WhatsAppTransport } from '@/lib/whatsapp/transport-types'
import { MetaTransport } from '@/lib/whatsapp/meta-transport'
import { QRTransport } from '@/lib/whatsapp/qr-transport-manager'
import { decrypt } from '@/lib/whatsapp/encryption'
import { createClient } from '@/lib/supabase/server'

export async function getTransport(accountId: string): Promise<WhatsAppTransport | null> {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('provider, phone_number_id, access_token')
    .eq('account_id', accountId)
    .maybeSingle()

  if (!config) return null

  if (config.provider === 'qr') {
    return new QRTransport(accountId)
  }

  const accessToken = decrypt(config.access_token)
  return new MetaTransport(config.phone_number_id, accessToken)
}

export async function getDecryptedConfig(accountId: string) {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle()

  if (!config) return null

  if (config.provider !== 'qr' && config.access_token) {
    config.access_token = decrypt(config.access_token)
    if (config.verify_token) config.verify_token = decrypt(config.verify_token)
  }

  return config
}
