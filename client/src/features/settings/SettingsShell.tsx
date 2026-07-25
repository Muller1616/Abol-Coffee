import { KeyRound, Store } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DocumentTitle } from '@/components/DocumentTitle'
import { cn } from '@/lib/utils'

export type SettingsTab = 'security' | 'restaurant'

const tabs: Array<{ id: SettingsTab; label: string; to: string; icon: typeof KeyRound }> = [
  { id: 'security', label: 'Security', to: '/admin/account', icon: KeyRound },
  { id: 'restaurant', label: 'Restaurant', to: '/admin/restaurant', icon: Store },
]

type SettingsShellProps = {
  activeTab: SettingsTab
  children: ReactNode
}

export function SettingsShell({ activeTab, children }: SettingsShellProps) {
  return (
    <div className="space-y-6">
      <DocumentTitle
        title={activeTab === 'security' ? 'Security · Settings' : 'Restaurant · Settings'}
      />

      <div>
        <p className="text-sm font-medium text-primary">Settings</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Account & restaurant
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Manage owner security and the public restaurant profile guests see on your QR menu.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-border/80 bg-white/80 p-1.5 shadow-[0_8px_30px_rgb(15_23_42/0.04)]"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <Link
              key={tab.id}
              to={tab.to}
              role="tab"
              aria-selected={active}
              className={cn(
                'inline-flex min-w-36 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(15_118_110/0.22)]'
                  : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground',
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
