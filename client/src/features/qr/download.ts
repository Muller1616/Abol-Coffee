import { api } from '@/lib/api'

const FILE_BASENAME = 'abol-coffee-menu-qr'

export async function downloadQrFile(format: 'png' | 'svg') {
  const { data } = await api.get<Blob>(`/api/admin/qr/${format}`, {
    responseType: 'blob',
  })

  const objectUrl = URL.createObjectURL(data)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `${FILE_BASENAME}.${format}`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export function printQrSheet(options: {
  pngDataUrl: string
  menuUrl: string
  restaurantName: string
}) {
  const { pngDataUrl, menuUrl, restaurantName } = options
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900')

  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to print the QR code.')
  }

  const safeName = restaurantName.replace(/[<>&"]/g, '')
  const safeUrl = menuUrl.replace(/[<>&"]/g, '')

  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${safeName} — Menu QR</title>
    <style>
      @page { margin: 18mm; }
      body {
        margin: 0;
        font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
        color: #0f172a;
        text-align: center;
      }
      .sheet {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        padding: 24px;
      }
      h1 {
        margin: 0;
        font-size: 28px;
        letter-spacing: -0.02em;
      }
      p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
      }
      img {
        width: 320px;
        height: 320px;
        object-fit: contain;
      }
      .url {
        max-width: 420px;
        word-break: break-all;
        font-size: 12px;
        color: #334155;
      }
      .note {
        font-size: 11px;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1>${safeName}</h1>
      <p>Scan to view our digital menu</p>
      <img src="${pngDataUrl}" alt="Menu QR code" />
      <p class="url">${safeUrl}</p>
      <p class="note">This code stays valid when the menu changes.</p>
    </div>
  </body>
</html>`)

  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(triggerPrint, 150)
  } else {
    printWindow.onload = () => window.setTimeout(triggerPrint, 150)
  }
}
