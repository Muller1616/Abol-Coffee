export function MenuPlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium text-primary">Public menu</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Coming in the next steps</h1>
        <p className="mt-3 text-muted-foreground">
          This route (`/menu`) is reserved for the permanent QR digital menu experience.
        </p>
      </div>
    </main>
  )
}
