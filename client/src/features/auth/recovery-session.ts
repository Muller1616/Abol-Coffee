const STORAGE_KEY = 'abol_password_recovery'

export type RecoveryStep = 'request' | 'verify' | 'reset'

export type PasswordRecoveryState = {
  email: string
  step: RecoveryStep
  expiresAt: string | null
  resendAvailableAt: string | null
  resetToken: string | null
  resetExpiresAt: string | null
}

export function loadRecoveryState(): PasswordRecoveryState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PasswordRecoveryState
    if (!parsed || typeof parsed.email !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function saveRecoveryState(state: PasswordRecoveryState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearRecoveryState() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function secondsUntil(iso: string | null | undefined): number {
  if (!iso) return 0
  const target = Date.parse(iso)
  if (!Number.isFinite(target)) return 0
  return Math.max(0, Math.ceil((target - Date.now()) / 1000))
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
