import { type ReactNode } from 'react'
import { Phone } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { handlePhoneClick } from '@/lib/phone'

type PhoneContactLinkProps = {
  phone: string
  className?: string
  icon?: ReactNode
  children?: ReactNode
}

export function PhoneContactLink({
  phone,
  className = 'inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95',
  icon = <Phone className="h-3.5 w-3.5 text-emerald-300" />,
  children,
}: PhoneContactLinkProps) {
  const { pushToast } = useToast()

  return (
    <button
      type="button"
      onClick={() => handlePhoneClick(phone, pushToast)}
      className={className}
      aria-label={`Contact phone ${phone}`}
    >
      {icon}
      {children ?? <span>{phone}</span>}
    </button>
  )
}
