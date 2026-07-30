/**
 * Re-exports for the application-wide validation & feedback UI system.
 * Prefer importing from the specific component modules in app code;
 * this barrel exists for discoverability.
 */
export { Alert, ErrorAlert, InfoAlert, SuccessAlert, WarningAlert } from '@/components/ui/alert'
export { Button } from '@/components/ui/button'
export { ConfirmDialog } from '@/components/ui/confirm-dialog'
export { FieldError } from '@/components/ui/field-error'
export { FormErrorSummary } from '@/components/ui/form-error-summary'
export {
  ImageUpload,
  IMAGE_UPLOAD_ACCEPTED,
  IMAGE_UPLOAD_ACCEPTED_TYPES,
  IMAGE_UPLOAD_MAX_BYTES,
  validateImageFile,
} from '@/components/ui/image-upload'
export { ToastProvider, useToast, type ToastTone } from '@/components/ui/toast'
