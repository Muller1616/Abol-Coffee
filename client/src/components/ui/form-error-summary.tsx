import { AlertTriangle } from 'lucide-react'
import type { FieldErrors } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { countFieldErrors } from '@/lib/form'

type FormErrorSummaryProps = {
  errors: FieldErrors
  submitCount: number
  message?: string
}

/** Top-of-form summary shown after submit when any fields are invalid. */
export function FormErrorSummary({
  errors,
  submitCount,
  message = 'Please correct the highlighted fields before continuing.',
}: FormErrorSummaryProps) {
  const count = countFieldErrors(errors)
  if (submitCount < 1 || count < 1) return null

  return (
    <Alert tone="warning" icon={AlertTriangle}>
      {message}
    </Alert>
  )
}
