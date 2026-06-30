import {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  sendReactionMessage,
} from '@/lib/whatsapp/meta-api'
import type {
  WhatsAppTransport,
  SendTextOptions,
  SendMediaOptions,
  SendTemplateOptions,
  SendReactionOptions,
  SendResult,
} from '@/lib/whatsapp/transport-types'

export class MetaTransport implements WhatsAppTransport {
  readonly provider = 'meta' as const

  constructor(
    private readonly phoneNumberId: string,
    private readonly accessToken: string,
  ) {}

  async sendText(opts: SendTextOptions): Promise<SendResult> {
    const result = await sendTextMessage({
      phoneNumberId: this.phoneNumberId,
      accessToken: this.accessToken,
      to: opts.to,
      text: opts.text,
      contextMessageId: opts.contextMessageId,
    })
    return { messageId: result.messageId }
  }

  async sendMedia(opts: SendMediaOptions): Promise<SendResult> {
    const result = await sendMediaMessage({
      phoneNumberId: this.phoneNumberId,
      accessToken: this.accessToken,
      to: opts.to,
      kind: opts.kind,
      link: opts.link,
      caption: opts.caption,
      filename: opts.filename,
    })
    return { messageId: result.messageId }
  }

  async sendTemplate(opts: SendTemplateOptions): Promise<SendResult> {
    const result = await sendTemplateMessage({
      phoneNumberId: this.phoneNumberId,
      accessToken: this.accessToken,
      to: opts.to,
      templateName: opts.templateName,
      language: opts.language,
    })
    return { messageId: result.messageId }
  }

  async sendReaction(opts: SendReactionOptions): Promise<SendResult> {
    const result = await sendReactionMessage({
      phoneNumberId: this.phoneNumberId,
      accessToken: this.accessToken,
      to: opts.to,
      targetMessageId: opts.targetMessageId,
      emoji: opts.emoji,
    })
    return { messageId: result.messageId }
  }

  async ping(): Promise<boolean> {
    try {
      const { verifyPhoneNumber } = await import('@/lib/whatsapp/meta-api')
      await verifyPhoneNumber({
        phoneNumberId: this.phoneNumberId,
        accessToken: this.accessToken,
      })
      return true
    } catch {
      return false
    }
  }
}
