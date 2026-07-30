import type { FieldErrors, FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'

export const VALIDATION_TOAST = 'Please complete all required fields.'
export const SERVER_FIELD_TOAST = 'Please correct the highlighted fields and try again.'

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

export function focusFirstInvalidField(root?: ParentNode | null) {
  window.requestAnimationFrame(() => {
    const scope = root ?? document
    const el = scope.querySelector<HTMLElement>(
      'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"], [data-invalid="true"] [role="button"], [data-invalid="true"] button',
    )

    if (!el) return

    el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

type ToastPusher = (title: string, tone?: 'success' | 'error' | 'warning' | 'info') => void

/** Shared invalid-submit handler: toast + focus first invalid control. */
export function createFormInvalidHandler(pushToast: ToastPusher) {
  return (_errors: FieldErrors) => {
    pushToast(VALIDATION_TOAST, 'warning')
    focusFirstInvalidField()
  }
}

/** Map structured backend field errors onto react-hook-form fields. */
export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  error: unknown,
): boolean {
  const fieldErrors = getApiFieldErrors(error)
  if (fieldErrors.length === 0) return false

  let applied = false

  fieldErrors.forEach((detail) => {
    // Ignore non-form keys that cannot be mapped onto RHF fields.
    if (detail.path === 'body' || detail.path === '_form' || detail.path === 'image') {
      return
    }

    setError(
      detail.path as Path<TFieldValues>,
      { type: 'server', message: detail.message },
      { shouldFocus: !applied },
    )
    applied = true
  })

  if (applied) {
    focusFirstInvalidField()
  }

  return applied
}

type HandleFormMutationErrorOptions<TFieldValues extends FieldValues> = {
  setError: UseFormSetError<TFieldValues>
  error: unknown
  pushToast: ToastPusher
  /** Called when the error has no mappable fields (top-level alert). */
  onFormError?: (message: string) => void
  /** Toast used when fields were mapped. Defaults to SERVER_FIELD_TOAST. */
  fieldToast?: string
  fallbackMessage?: string
}

/**
 * Central API error handler for form submits.
 * Maps field errors inline; otherwise surfaces a top-level message + toast.
 * Never reuses the client "required fields" toast for server failures.
 */
export function handleFormMutationError<TFieldValues extends FieldValues>({
  setError,
  error,
  pushToast,
  onFormError,
  fieldToast = SERVER_FIELD_TOAST,
  fallbackMessage = 'Unable to save changes. Please try again.',
}: HandleFormMutationErrorOptions<TFieldValues>): boolean {
  const fieldErrors = getApiFieldErrors(error)
  const applied = applyServerFieldErrors(setError, error)

  // Image / form-level keys that cannot be setError'd onto RHF fields.
  const imageError = fieldErrors.find((item) => item.path === 'image')
  const formLevel = fieldErrors.find((item) => item.path === '_form' || item.path === 'body')

  if (applied || imageError || formLevel) {
    if (imageError) {
      onFormError?.(imageError.message)
      pushToast(imageError.message, 'error')
      return true
    }
    if (formLevel && !applied) {
      onFormError?.(formLevel.message)
      pushToast(formLevel.message, 'error')
      return true
    }

    const toastMessage =
      fieldErrors.length === 1 ? (fieldErrors[0]?.message ?? fieldToast) : fieldToast
    pushToast(toastMessage, fieldErrors.length === 1 ? 'error' : 'warning')
    return true
  }

  const message = getApiErrorMessage(error, fallbackMessage)
  onFormError?.(message)
  pushToast(message, 'error')
  return false
}

/** Use in React Query mutation `onError` to avoid duplicate toasts when fields were mapped. */
export function shouldSkipMutationToast(error: unknown): boolean {
  return getApiFieldErrors(error).length > 0
}
