import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import {
  LandingContainer,
  LandingSection,
  LandingSectionHeader,
} from '@/features/landing/ui'
import { cn } from '@/lib/utils'

const OWNER_FAQS = [
  {
    question: 'Can I update prices anytime?',
    answer:
      'Yes. Changes appear on the public menu immediately. Edit any item’s ETB price from your owner console whenever you need.',
  },
  {
    question: 'Do I need to print another QR code after editing my menu?',
    answer:
      'No. The QR code stays the same. Print it once for tables or counters—it always opens your live menu.',
  },
  {
    question: 'Can customers access the menu without an account?',
    answer:
      'Yes. Guests scan with their phone camera and the menu opens in the browser—no login or app download.',
  },
  {
    question: 'Can I upload food images?',
    answer:
      'Yes. Upload photos for menu items, plus your restaurant logo and cover image.',
  },
  {
    question: 'Can I temporarily hide unavailable items?',
    answer:
      'Yes. Toggle any item or category off with one click. Hidden items leave the guest menu until you turn them back on.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <LandingSection id="faq" tone="soft">
      <LandingContainer className="max-w-3xl">
        <LandingSectionHeader
          eyebrow={
            <>
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </>
          }
          title="Questions from restaurant owners"
          description="Clear answers on how the digital QR menu works for your business."
        />

        <div className="mt-12 space-y-3">
          {OWNER_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base font-bold text-foreground sm:text-lg">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                      isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-6"
                    >
                      <div className="pt-4">{faq.answer}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </LandingContainer>
    </LandingSection>
  )
}
