import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Printer,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { fetchQrPreview } from '@/features/qr/api'
import { downloadQrFile, printQrSheet } from '@/features/qr/download'
import { fetchRestaurant } from '@/features/restaurant/api'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

export function QrPage() {
  const { pushToast } = useToast()

  const qrQuery = useQuery({
    queryKey: ['admin', 'qr'],
    queryFn: fetchQrPreview,
  })

  const restaurantQuery = useQuery({
    queryKey: ['admin', 'restaurant'],
    queryFn: fetchRestaurant,
  })

  const downloadMutation = useMutation({
    mutationFn: downloadQrFile,
    onSuccess: (_data, format) =>
      pushToast(`${format.toUpperCase()} downloaded`),
    onError: (error) =>
      pushToast(getApiErrorMessage(error, 'Could not download QR code'), 'error'),
  })

  const handlePrint = () => {
    if (!qrQuery.data) {
      pushToast('QR preview is not ready', 'error')
      return
    }

    try {
      // Call print synchronously from the click handler (no popup / no mutation delay).
      printQrSheet({
        pngDataUrl: qrQuery.data.pngDataUrl,
        menuUrl: qrQuery.data.menuUrl,
        restaurantName: restaurantQuery.data?.name ?? 'Abol Coffee',
      })
      pushToast('Print dialog opened')
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Could not open print dialog'), 'error')
    }
  }

  const copyUrl = async () => {
    if (!qrQuery.data?.menuUrl) return
    try {
      await navigator.clipboard.writeText(qrQuery.data.menuUrl)
      pushToast('Menu URL copied')
    } catch {
      pushToast('Could not copy URL', 'error')
    }
  }

  if (qrQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full max-w-xl" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[480px]" />
          <Skeleton className="h-[480px]" />
        </div>
      </div>
    )
  }

  if (qrQuery.isError || !qrQuery.data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Unable to load QR studio"
        description={getApiErrorMessage(qrQuery.error, 'Please refresh and try again.')}
        className="min-h-[420px] bg-white"
      />
    )
  }

  const qr = qrQuery.data
  const restaurantName = restaurantQuery.data?.name ?? 'Abol Coffee'
  const isLive = restaurantQuery.data?.status === 'ACTIVE'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Distribution</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            QR studio
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Preview, download, and print the permanent code for your public menu. Menu edits never
            require a new QR.
          </p>
        </div>
        {restaurantQuery.data ? (
          <Badge variant={isLive ? 'success' : 'warning'}>
            {isLive ? 'Public menu live' : 'Maintenance mode'}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-8"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Live preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Encodes your permanent public menu URL only.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
          </div>

          <div className="mx-auto flex max-w-md flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className="relative flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[32px] border border-border bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#ffffff_55%)] p-6 shadow-inner"
            >
              <img
                src={qr.pngDataUrl}
                alt={`${restaurantName} menu QR code`}
                className="h-full w-full object-contain"
              />
            </motion.div>

            <p className="mt-5 text-center text-sm font-semibold tracking-tight">{restaurantName}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Scan to open the digital menu
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              loading={downloadMutation.isPending && downloadMutation.variables === 'png'}
              disabled={downloadMutation.isPending}
              onClick={() => downloadMutation.mutate('png')}
            >
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              loading={downloadMutation.isPending && downloadMutation.variables === 'svg'}
              disabled={downloadMutation.isPending}
              onClick={() => downloadMutation.mutate('svg')}
            >
              <Download className="h-4 w-4" />
              Download SVG
            </Button>
            <Button
              className="sm:col-span-2"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Print table tent
            </Button>
          </div>
        </motion.section>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
          >
            <h2 className="text-lg font-semibold tracking-tight">Permanent menu URL</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is what every printed QR encodes. Keep it stable in production.
            </p>

            <div className="mt-4 rounded-2xl border border-border/80 bg-[#f8fafc] p-4">
              <p className="break-all text-sm font-medium leading-relaxed text-foreground">
                {qr.menuUrl}
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => void copyUrl()}>
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
              <a
                href={qr.menuUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                <ExternalLink className="h-4 w-4" />
                Open menu
              </a>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/5 via-white to-accent/10 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Print once</h2>
                <p className="text-sm text-muted-foreground">Critical permanence rule</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                The QR points only to this public URL — never to menu content or prices.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Category, item, image, and price updates appear automatically for every scan.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Reprint only if the production public domain/URL itself changes.
              </li>
            </ul>

            <p className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-border/70">
              {qr.note}
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
