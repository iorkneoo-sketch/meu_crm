export type WhatsAppProvider = 'meta' | 'qr'

export interface SendTextOptions {
  to: string
  text: string
  contextMessageId?: string
}

export interface SendMediaOptions {
  to: string
  kind: 'image' | 'video' | 'document' | 'audio'
  link: string
  caption?: string
  filename?: string
}

export interface SendTemplateOptions {
  to: string
  templateName: string
  language?: string
  components: unknown[]
}

export interface SendReactionOptions {
  to: string
  targetMessageId: string
  emoji: string
}

export interface SendResult {
  messageId: string
}

export interface WhatsAppTransport {
  readonly provider: WhatsAppProvider
  sendText(opts: SendTextOptions): Promise<SendResult>
  sendMedia(opts: SendMediaOptions): Promise<SendResult>
  sendTemplate(opts: SendTemplateOptions): Promise<SendResult>
  sendReaction(opts: SendReactionOptions): Promise<SendResult>
  ping(): Promise<boolean>
}
