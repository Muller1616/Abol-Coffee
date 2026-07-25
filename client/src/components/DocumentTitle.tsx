import { useEffect } from 'react'

type DocumentTitleProps = {
  title: string
}

export function DocumentTitle({ title }: DocumentTitleProps) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])

  return null
}
