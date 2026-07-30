import { Link } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { DocumentTitle } from '@/components/DocumentTitle'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col items-start justify-center px-6 py-16">
      <DocumentTitle title="Not found · Abol Coffee" />
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <BackLink tone="light" label="Back to home" />
      </div>
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you requested does not exist.</p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/" className={cn(buttonVariants(), 'h-11 w-full justify-center sm:w-auto')}>
          Back home
        </Link>
        <Link
          to="/menu"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 w-full justify-center sm:w-auto')}
        >
          Public menu
        </Link>
      </div>
    </main>
  )
}
