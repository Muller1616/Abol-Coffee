import { Component, type ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  private handleReload = () => {
    window.location.assign('/')
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-start justify-center px-6 py-16">
        <p className="text-sm font-medium text-primary">Something went wrong</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          This page hit an unexpected error
        </h1>
        <p className="mt-3 text-muted-foreground">
          Try again, or return home. If the problem continues, refresh the browser.
        </p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={this.handleRetry}
            className={cn(buttonVariants(), 'h-11 w-full justify-center sm:w-auto')}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 w-full justify-center sm:w-auto')}
          >
            Back home
          </button>
        </div>
      </main>
    )
  }
}
