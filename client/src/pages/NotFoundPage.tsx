import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-start justify-center px-6 py-16">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you requested does not exist.</p>
      <Link to="/" className={cn(buttonVariants(), 'mt-6')}>
        Back home
      </Link>
    </main>
  )
}
