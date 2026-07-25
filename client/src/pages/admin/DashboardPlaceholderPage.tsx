export function DashboardPlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium text-primary">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          Protected dashboard screens will connect to `/api/admin/dashboard` in upcoming steps.
        </p>
      </div>
    </main>
  )
}
