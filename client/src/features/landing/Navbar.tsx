import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Menu as MenuIcon, X, QrCode, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else if (href === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'border-b border-white/10 bg-[#06120f]/92 py-3 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-transparent py-5',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="group flex cursor-pointer items-center gap-3 text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary via-primary/80 to-accent text-white shadow-md shadow-primary/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <Coffee className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Abol Coffee
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
              Restaurant Menu Platform
            </span>
          </div>
        </Link>

        {/* 3 Navigation Links */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/admin/login"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-linear-to-r from-amber-400 to-amber-500 font-bold text-slate-950 shadow-md shadow-amber-400/20 hover:brightness-105',
            )}
          >
            <LogIn className="h-3.5 w-3.5" />
            Owner Login
          </Link>
          <Link
            to="/menu"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white',
            )}
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-400" />
            View Live Menu
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-b border-white/10 bg-[#06120f]/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-2 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.name}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4">
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full justify-center bg-linear-to-r from-amber-400 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-400/20',
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  Owner Login
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'w-full justify-center border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10',
                  )}
                >
                  <QrCode className="h-4 w-4 text-emerald-400" />
                  View Live Menu
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
