import { Coffee, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FooterSection() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="border-t border-white/10 bg-[#040c0a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-white shadow-md">
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
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              A premium digital QR menu platform built specifically for restaurant, café, and coffee shop owners in Ethiopia. Eliminate paper reprinting costs forever.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-white/70">
              <li>
                <a href="#hero" onClick={(e) => scrollToSection(e, '#hero')} className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Console</h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-white/70">
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors">
                  Owner Login
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-white transition-colors">
                  View Live Menu
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">Contact Info</h3>
            <p className="mt-4 text-xs leading-relaxed text-white/70">
              Bole Road, Friendship Building Area
              <br />
              Addis Ababa, Ethiopia
            </p>
            <p className="mt-3 text-xs text-white/70">+251 911 234 567</p>
            <p className="mt-1 text-xs text-white/70">support@abolcoffee.com</p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row">
          <p>© 2026 Abol Coffee. All rights reserved.</p>
          <div className="flex items-center gap-1 text-white/60">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
            <span>for restaurant owners</span>
          </div>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
