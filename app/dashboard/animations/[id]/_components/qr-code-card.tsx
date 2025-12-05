'use client'

// QR Code Card Component (Story 5.2 AC2)
// Displays QR code with download button
import { useState } from 'react'
import Image from 'next/image'
import { Download, QrCode, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnimationResponse } from '@/lib/services/animation.service'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/auth.store'

interface QrCodeCardProps {
  animation: AnimationResponse | null
  loading?: boolean
}

export function QrCodeCard({ animation, loading }: QrCodeCardProps) {
  const { getAccessToken } = useAuthStore()
  const [downloading, setDownloading] = useState(false)

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </CardTitle>
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent className="flex justify-center pt-2">
          <Skeleton className="h-24 w-24" />
        </CardContent>
      </Card>
    )
  }

  if (!animation) {
    return null
  }

  const handleDownload = async () => {
    if (!animation.qrCodeUrl) {
      toast.error('Aucun QR code disponible')
      return
    }

    setDownloading(true)
    try {
      const token = getAccessToken()

      // Use API endpoint to download (avoids CORS issues with Azure Blob)
      const response = await fetch(`/api/animations/${animation.id}/qrcode`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Erreur lors du téléchargement')
      }

      // Get blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${animation.slug}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('QR code téléchargé')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const isPublished = animation.status === 'published'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code
        </CardTitle>
        {animation.qrCodeUrl && (
          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Télécharger PNG"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex justify-center pt-2">
        {animation.qrCodeUrl ? (
          <div className="relative h-24 w-24 bg-white rounded-lg p-1.5 shadow-sm">
            <Image
              src={animation.qrCodeUrl}
              alt={`QR Code pour ${animation.name}`}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="text-center py-2">
            <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {isPublished
                ? 'Non disponible'
                : 'Généré à la publication'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
