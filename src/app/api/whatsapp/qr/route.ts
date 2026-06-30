import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { connectQR, disconnectQR, getQRStatus } from '@/lib/whatsapp/qr-transport-manager'

async function resolveAccountId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.account_id as string | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = await resolveAccountId(user.id)
    if (!accountId) {
      return NextResponse.json({ error: 'No account' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'connect') {
      await connectQR(accountId)
      return NextResponse.json({ success: true })
    }

    if (action === 'disconnect') {
      await disconnectQR(accountId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[QR] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = await resolveAccountId(user.id)
    if (!accountId) {
      return NextResponse.json({ error: 'No account' }, { status: 403 })
    }

    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('qr_code, connection_status, provider')
      .eq('account_id', accountId)
      .maybeSingle()

    const sessionStatus = getQRStatus(accountId)

    return NextResponse.json({
      qr_code: config?.qr_code || null,
      connection_status: config?.connection_status || 'disconnected',
      session_status: sessionStatus.status,
      provider: config?.provider || 'meta',
    })
  } catch (err) {
    console.error('[QR] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
