import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'

type UseUnsavedChangesResult = {
  dialogOpen: boolean
  confirmLeave: () => void
  cancelLeave: () => void
}

/**
 * Blocks in-app navigation and browser refresh/close when `isDirty` is true.
 */
export function useUnsavedChanges(isDirty: boolean): UseUnsavedChangesResult {
  const blocker = useBlocker(isDirty)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setDialogOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!isDirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const confirmLeave = () => {
    setDialogOpen(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }

  const cancelLeave = () => {
    setDialogOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }

  return {
    dialogOpen,
    confirmLeave,
    cancelLeave,
  }
}
