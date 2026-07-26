import { AlertTriangle } from 'lucide-react'
import type { FieldErrors } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { countFieldErrors } from '@/lib/form'

type FormErrorSummaryProps = {
  errors: FieldErrors
  submitCount: number
}

export function FormErrorSummary({ errors, submitCount }: FormErrorSummaryProps) {
  const count = countFieldErrors(errors)
  if (submitCount < 1 || count < 1) return null

  return (
    <Alert icon={AlertTriangle}>
      Please correct the highlighted fields before continuing.
    </Alert>
  )
}
