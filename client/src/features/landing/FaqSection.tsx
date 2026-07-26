import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useState } from 'react'

const OWNER_FAQS = [
  {
    question: 'Can I update prices anytime?',
    answer:
      'Yes. Changes appear instantly on the public menu in 0.1 seconds. You can edit any item’s price in ETB from your owner console at any time.',
  },
  {
    question: 'Do I need to print another QR code after editing my menu?',
    answer:
      'No. The QR code always remains the same. Print it once for your table displays or counter cards, and it will direct customers to your live menu forever.',
  },
  {
    question: 'Can customers access the menu without creating an account?',
    answer:
      'Yes. Customers simply point their smartphone camera at your table QR code and the menu opens immediately in their web browser without any login or app download.',
  },
  {
    question: 'Can I upload food images?',
    answer:
      'Yes. You can upload high-resolution food and beverage photos for every menu item, as well as your restaurant logo and hero cover photo.',
  },
  {
    question: 'Can I temporarily hide unavailable items?',
    answer:
      'Yes. You can toggle any menu item or category as unavailable with a single click. Hidden items are immediately removed from the guest menu until you re-enable them.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="relative bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Frequently Asked Questions</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Questions From Restaurant Owners
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base text-muted-foreground sm:text-lg"
          >
            Clear answers on how the digital QR menu system works for your business.
          </motion.p>
        </div>

        {/* Accordions List */}
        <div className="mt-16 space-y-4">
          {OWNER_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-colors hover:border-primary/40"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full cursor-pointer items-center justify-between p-6 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base font-bold text-foreground sm:text-lg">
                    {faq.question}
                  </span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-slate-100 px-6 pb-6 pt-4 text-sm leading-relaxed text-muted-foreground"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
