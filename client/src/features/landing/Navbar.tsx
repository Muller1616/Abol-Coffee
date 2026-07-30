import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Menu as MenuIcon, X, QrCode, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { LandingContainer } from '@/features/landing/ui'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { name: 'Home', href: '#hero' },
  { name: 'Features', href: '#features' },
  { name: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
    else if (href === '#hero') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
        isScrolled
          ? 'border-b border-white/10 bg-brand-ink/95 py-3 shadow-[0_12px_40px_rgb(0_0_0/0.25)] backdrop-blur-md'
          : 'bg-transparent py-5',
      )}
    >
      <LandingContainer className="flex items-center justify-between">
        <Link
          to="/"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="group flex items-center gap-3 text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(15_118_110/0.35)] transition-transform group-hover:scale-105">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Abol Coffee
            </span>
            <span className="text-[10px] font-medium tracking-[0.16em] text-white/60 uppercase">
              Digital Menu Platform
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/menu"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-white/80 hover:bg-white/10 hover:text-white',
            )}
          >
            <QrCode className="h-3.5 w-3.5" />
            View menu
          </Link>
          <Link to="/admin/login" className={cn(buttonVariants({ size: 'sm' }))}>
            <LogIn className="h-3.5 w-3.5" />
            Owner login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </LandingContainer>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-white/10 bg-brand-ink/98 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-2 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  {link.name}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4">
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center')}
                >
                  <LogIn className="h-4 w-4" />
                  Owner login
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'w-full justify-center border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white',
                  )}
                >
                  <QrCode className="h-4 w-4" />
                  View live menu
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
