import { Coffee } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LandingContainer } from '@/features/landing/ui'
import { PublicMenuLink } from '@/features/public-menu/PublicMenuLink'

export function FooterSection() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-white/10 bg-brand-ink text-white">
      <LandingContainer className="py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Coffee className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-tight text-white">
                  Abol Coffee
                </span>
                <span className="text-[10px] font-medium tracking-[0.16em] text-white/55 uppercase">
                  Digital menu platform
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              A digital QR menu platform for restaurants and coffee shops—update once, serve
              everywhere.
            </p>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-white/50 uppercase">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => scrollToSection(e, '#hero')}
                  className="transition-colors hover:text-white"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollToSection(e, '#features')}
                  className="transition-colors hover:text-white"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => scrollToSection(e, '#contact')}
                  className="transition-colors hover:text-white"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold tracking-wider text-white/50 uppercase">
              Console
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <Link to="/login" className="transition-colors hover:text-white">
                  Owner login
                </Link>
              </li>
              <li>
                <PublicMenuLink className="transition-colors hover:text-white">
                  View live menu
                </PublicMenuLink>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-white/50 uppercase">
              Contact
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Semit, around Ajora
              <br />
              Addis Ababa, Ethiopia
            </p>
            <p className="mt-3 text-sm text-white/70">+251 912 456 789</p>
            <p className="mt-1 text-sm text-white/70">Habeshadreamer12@gmail.com</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/45 sm:flex-row sm:items-center">
          <p>© 2026 Abol Coffee. All rights reserved.</p>
        </div>
      </LandingContainer>
    </footer>
  )
}
