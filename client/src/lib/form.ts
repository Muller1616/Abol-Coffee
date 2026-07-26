import type { FieldErrors, FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { getApiErrorField, getApiValidationDetails } from '@/lib/api'

export const VALIDATION_TOAST = 'Please complete all required fields.'

export function countFieldErrors(errors: FieldErrors): number {
  let count = 0

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return

    if ('message' in node && typeof (node as { message?: unknown }).message === 'string') {
      count += 1
      return
    }

    for (const value of Object.values(node as Record<string, unknown>)) {
      walk(value)
    }
  }

  walk(errors)
  return count
}

export function focusFirstInvalidField() {
  window.requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(
      'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]',
    )

    if (!el) return

    el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

type ToastPusher = (title: string, tone?: 'success' | 'error') => void

/** Shared invalid-submit handler: toast + focus first invalid control. */
export function createFormInvalidHandler(pushToast: ToastPusher) {
  return (_errors: FieldErrors) => {
    pushToast(VALIDATION_TOAST, 'error')
    focusFirstInvalidField()
  }
}

/** Map structured backend validation details or single field error onto react-hook-form fields. */
export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  error: unknown,
): boolean {
  let applied = false

  const details = getApiValidationDetails(error)
  if (details && details.length > 0) {
    details.forEach((detail, index) => {
      setError(
        detail.path as Path<TFieldValues>,
        { type: 'server', message: detail.message },
        { shouldFocus: index === 0 },
      )
    })
    applied = true
  }

  const singleField = getApiErrorField(error)
  if (singleField) {
    setError(
      singleField.field as Path<TFieldValues>,
      { type: 'server', message: singleField.message },
      { shouldFocus: true },
    )
    applied = true
  }

  if (applied) {
    focusFirstInvalidField()
  }

  return applied
}
