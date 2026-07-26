export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return userAgentMobile || (isSmallScreen && hasTouch)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall back to legacy method
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch {
    return false
  }
}

export async function handlePhoneClick(
  phone: string,
  pushToast: (message: string, tone?: 'success' | 'error') => void,
) {
  const cleanPhone = phone.trim()
  if (!cleanPhone) return

  if (isMobileDevice()) {
    // On mobile phone: trigger native dialer / phone call
    const digitsOnly = cleanPhone.replace(/[^+\d]/g, '')
    window.location.href = `tel:${digitsOnly || cleanPhone}`
  } else {
    // On desktop / laptop: copy number to clipboard and show toast
    const success = await copyToClipboard(cleanPhone)
    if (success) {
      pushToast(`Phone number copied to clipboard: ${cleanPhone}`, 'success')
    } else {
      pushToast(`Phone number: ${cleanPhone}`, 'success')
    }
  }
}
