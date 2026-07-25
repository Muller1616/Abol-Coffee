import { Link } from 'react-router-dom'
import { DocumentTitle } from '@/components/DocumentTitle'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col items-start justify-center px-6 py-16">
      <DocumentTitle title="Not found · Abol Coffee" />
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you requested does not exist.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className={cn(buttonVariants())}>
          Back home
        </Link>
        <Link to="/menu" className={cn(buttonVariants({ variant: 'outline' }))}>
          Public menu
        </Link>
      </div>
    </main>
  )
}
