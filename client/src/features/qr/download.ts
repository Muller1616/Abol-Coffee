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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Print via a hidden iframe so browsers never treat this as a pop-up.
 * Must be called directly from a user click (not after an await).
 */
export function printQrSheet(options: {
  pngDataUrl: string
  menuUrl: string
  restaurantName: string
}) {
  const { pngDataUrl, menuUrl, restaurantName } = options
  const safeName = escapeHtml(restaurantName)
  const safeUrl = escapeHtml(menuUrl)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('title', 'Print QR code')
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  })
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDocument = iframe.contentDocument ?? frameWindow?.document

  if (!frameWindow || !frameDocument) {
    iframe.remove()
    throw new Error('Could not prepare the print dialog. Please try again.')
  }

  frameDocument.open()
  frameDocument.write(`<!doctype html>
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
  frameDocument.close()

  const cleanup = () => {
    iframe.remove()
  }

  const triggerPrint = () => {
    try {
      frameWindow.focus()
      frameWindow.print()
    } finally {
      // Give the print dialog a moment to attach before removing the frame.
      window.setTimeout(cleanup, 1000)
    }
  }

  const image = frameDocument.querySelector('img')
  if (image && !image.complete) {
    image.onload = triggerPrint
    image.onerror = triggerPrint
    return
  }

  window.setTimeout(triggerPrint, 50)
}
