'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Smartphone, Loader2, CheckCircle, XCircle, WifiOff } from 'lucide-react'

export function WhatsAppQRConfig() {
  const { accountId } = useAuth()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/qr')
      const data = await res.json()
      setQrCode(data.qr_code)
      setConnectionStatus(data.connection_status)
    } catch { }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (connectionStatus === 'connected') return
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [connectionStatus, fetchStatus])

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('[QR] Connect error:', err)
        alert('Erro ao conectar: ' + (err.error || 'Verifique o console'))
        return
      }
      setTimeout(fetchStatus, 2000)
    } catch (err) {
      console.error('[QR] Connect error:', err)
      alert('Erro de rede ao conectar. Verifique o ENCRYPTION_KEY.')
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/whatsapp/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      setQrCode(null)
      setConnectionStatus('disconnected')
    } catch { }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground">WhatsApp via QR Code</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Conecte-se escaneando o QR Code com o WhatsApp do seu celular.
          Não requer conta empresarial Meta.
        </p>
      </div>

      {connectionStatus === 'connected' ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-green-500/20 bg-green-500/10 p-6">
          <CheckCircle className="h-12 w-12 text-green-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-green-400">WhatsApp Conectado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Seu WhatsApp está conectado e pronto para usar.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Desconectar
          </Button>
        </div>
      ) : connectionStatus === 'connecting' && qrCode ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-foreground">
            Escaneie o QR Code com o WhatsApp
          </p>
          <div className="rounded-lg border border-border bg-white p-4">
            {/* Using a simple QR rendering approach */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
              alt="QR Code"
              className="h-64 w-64"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Aguardando leitura...
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
          <Smartphone className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Clique no botão abaixo para gerar o QR Code e conectar seu WhatsApp.
            </p>
          </div>
          <Button onClick={handleConnect} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Conectar via QR Code
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-400/80">
          <strong>Nota:</strong> A conexão via QR Code usa uma biblioteca não-oficial do WhatsApp.
          Pode não ser tão estável quanto a API Business oficial. Recomendado para testes e uso pessoal.
          Esta funcionalidade requer um servidor com processo contínuo (não funciona no Vercel).
        </p>
      </div>
    </div>
  )
}
