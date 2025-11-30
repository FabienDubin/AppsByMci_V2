'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, Copy, Download, ExternalLink, LayoutDashboard, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface PublishSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  animationName: string
  publicUrl: string
  qrCodeUrl?: string
  onGoToDashboard: () => void
  onViewAnimation: () => void
}

/**
 * Modal de succès après publication
 * Affiche le QR code, l'URL publique et les options d'action
 */
export function PublishSuccessModal({
  open,
  onOpenChange,
  animationName,
  publicUrl,
  qrCodeUrl,
  onGoToDashboard,
  onViewAnimation,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('URL copiée dans le presse-papier')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erreur lors de la copie')
    }
  }

  const handleDownloadQRCode = async () => {
    if (!qrCodeUrl) return

    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${animationName.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('QR code téléchargé')
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            Animation publiée avec succès !
          </DialogTitle>
          <DialogDescription>
            Votre animation <strong>"{animationName}"</strong> est maintenant accessible
            au public.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code section */}
          {qrCodeUrl ? (
            <div className="flex flex-col items-center p-4 bg-white border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Scannez ce QR code pour accéder à l'animation
              </p>
              <div className="bg-white p-2 rounded-lg border shadow-sm">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code de l'animation"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleDownloadQRCode}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le QR code
              </Button>
            </div>
          ) : (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">QR code non disponible</AlertTitle>
              <AlertDescription className="text-amber-700 text-sm">
                Le QR code n'a pas pu être généré. L'animation reste publiée et accessible
                via l'URL ci-dessous.
              </AlertDescription>
            </Alert>
          )}

          {/* Public URL section */}
          <div className="space-y-2">
            <p className="text-sm font-medium">URL publique :</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md break-all">
                {publicUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onGoToDashboard}
            className="w-full sm:w-auto"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Tableau de bord
          </Button>
          <Button onClick={onViewAnimation} className="w-full sm:w-auto">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir l'animation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
