import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import { ChevronDown, Check, X } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Rag } from '../data/mock'
import { useStore } from '../store'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export const ease = [0.22, 1, 0.36, 1] as const

/* Buttons: Roma primary (filled) and secondary (1px border). */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading, className, children, disabled, ...rest },
  ref,
) {
  const sizes = { sm: 'px-3 py-1.5', md: 'px-[18px] py-[9px]', lg: 'h-[44px] px-5' }
  const variants = {
    primary: 'bg-primary text-primary-on hover:bg-primary-press border border-transparent',
    secondary: 'bg-canvas text-ink border border-hair-strong hover:border-ink-faint hover:bg-select/60',
    ghost: 'text-ink-2 hover:text-ink hover:bg-select border border-transparent',
    link: 'text-primary-ink hover:underline underline-offset-2 !p-0 border-0',
    danger: 'bg-rag-red text-white hover:brightness-95 border border-transparent',
  }
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
        variants[variant],
        className,
      )}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </motion.button>
  )
})

export const Spinner = ({ className }: { className?: string }) => (
  <span className={cx('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />
)

export const IconButton = ({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <Tooltip label={label}>
    <button
      aria-label={label}
      className={cx('flex size-8 items-center justify-center rounded-xs border border-hair-strong text-ink-2 transition-colors hover:bg-select hover:text-ink', className)}
      {...rest}
    >
      {children}
    </button>
  </Tooltip>
)

/* Status: a dot and a word, never colour alone. */
export const RagChip = ({ rag, children, className }: { rag: Rag; children: ReactNode; className?: string }) => {
  const map = {
    red: 'bg-red-wash text-rag-red',
    amber: 'bg-amber-wash text-rag-amber',
    green: 'bg-green-wash text-rag-green',
    grey: 'bg-select text-ink-2',
  }
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs px-2 py-[3px] text-sm font-medium', map[rag], className)}>
      <span className="size-2 rounded-full bg-current" />
      {children}
    </span>
  )
}

export const Avatar = ({ initials, dark, size = 32, className }: { initials: string; dark?: boolean; size?: number; className?: string }) => (
  <span
    style={{ width: size, height: size, fontSize: size > 40 ? 16 : 12 }}
    className={cx(
      'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
      dark ? 'bg-ink text-white' : 'bg-select text-ink',
      className,
    )}
  >
    {initials}
  </span>
)

export const Card = ({ className, children, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cx('card', className)} {...rest}>
    {children}
  </motion.div>
)

export const CardHeader = ({ title, count, right, className }: { title: ReactNode; count?: ReactNode; right?: ReactNode; className?: string }) => (
  <div className={cx('flex items-center gap-2', className)}>
    <h2 className="text-body font-medium">{title}</h2>
    {count !== undefined && <span className="font-mono text-mono text-ink-3">{count}</span>}
    <div className="flex-1" />
    {right}
  </div>
)

/* Segmented control with a sliding white thumb. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  className,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  id: string
  className?: string
}) {
  return (
    <div role="tablist" className={cx('flex shrink-0 gap-[2px] rounded-xs bg-select p-[3px]', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx('relative rounded-xs px-2.5 py-[5px] text-sm transition-colors', on ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink')}
          >
            {on && (
              <motion.span
                layoutId={'seg-' + id}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-xs border border-hair bg-canvas"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* Underlined tabs, used on the patient record. */
export function Tabs<T extends string>({ tabs, value, onChange, id }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; id: string }) {
  return (
    <div role="tablist" className="scroll-thin flex gap-8 overflow-x-auto">
      {tabs.map((t) => {
        const on = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cx('relative whitespace-nowrap pb-3 pt-1 text-body transition-colors', on ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink')}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-2 font-mono text-mono text-ink-3">{t.count}</span>}
            {on && <motion.span layoutId={'tab-' + id} className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}

export function Tooltip({ label, children, side = 'bottom' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  const [show, setShow] = useState(false)
  const t = useRef<number>()
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => {
        t.current = window.setTimeout(() => setShow(true), 350)
      }}
      onMouseLeave={() => {
        clearTimeout(t.current)
        setShow(false)
      }}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === 'bottom' ? -2 : 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cx(
              'pointer-events-none absolute left-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-2 py-1 text-cap text-white',
              side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/* Click-outside hook for menus and popovers. */
export function useOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open, onClose])
  return ref
}

export const popMotion = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.16, ease },
}

/* Dropdown select in the "Acuity B" pill style from the care gaps screen. */
export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  align = 'left',
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false))
  const current = options.find((o) => o.value === value)
  return (
    <div ref={ref} className="relative">
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx('flex h-[36px] items-center gap-2 rounded-md border px-3 text-body transition-colors', open ? 'border-ink' : 'border-hair-strong hover:border-ink-faint')}
      >
        <span className="text-ink-2">{label}</span>
        <span className="font-medium">{current?.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-ink-2">
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            {...popMotion}
            className={cx('absolute top-[calc(100%+6px)] z-40 min-w-[180px] rounded-lg border border-hair bg-canvas p-1 shadow-pop', align === 'right' ? 'right-0' : 'left-0')}
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-6 rounded-xs px-3 py-2 text-left text-sm hover:bg-select"
                >
                  {o.label}
                  {o.value === value && <Check size={14} className="text-primary-ink" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* Modal dialog with backdrop, focus on open, Escape to close. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
  eyebrow,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
  eyebrow?: ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    setTimeout(() => box.current?.querySelector<HTMLElement>('input,textarea,select,button[data-autofocus]')?.focus(), 60)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <motion.div
            ref={box}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease }}
            className="relative max-h-[90vh] w-full overflow-auto rounded-xl border border-hair bg-canvas shadow-pop"
          >
            {title && (
              <div className="flex items-start gap-4 px-6 pb-2 pt-6">
                <div className="flex-1">
                  {eyebrow && <div className="mb-1 text-label text-ink-2">{eyebrow}</div>}
                  <h2 className="text-sub">{title}</h2>
                </div>
                <button aria-label="Close" onClick={onClose} className="rounded-xs p-1 text-ink-2 hover:bg-select hover:text-ink">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="px-6 py-4">{children}</div>
            {footer && <div className="flex items-center justify-end gap-3 border-t border-hair px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Right-hand side panel. */
export function Drawer({ open, onClose, children, width = 480, label }: { open: boolean; onClose: () => void; children: ReactNode; width?: number; label: string }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[55]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={label}
            style={{ maxWidth: width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease }}
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-canvas shadow-pop"
          >
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease }}
            className="pointer-events-auto flex items-center gap-4 rounded-lg bg-ink py-3 pl-4 pr-2 text-sm text-white shadow-pop"
          >
            <Check size={16} className="shrink-0 text-white/70" />
            <span>{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run()
                  dismissToast(t.id)
                }}
                className="rounded-xs px-2 py-1 font-medium text-white underline-offset-2 hover:underline"
              >
                {t.action.label}
              </button>
            )}
            <button aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="rounded-xs p-1 text-white/60 hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export const Kbd = ({ children }: { children: ReactNode }) => (
  <span className="rounded-xs border border-hair-strong bg-canvas px-1.5 py-px font-mono text-mono text-ink-3">{children}</span>
)

export const Skeleton = ({ className }: { className?: string }) => <div className={cx('animate-pulse rounded-xs bg-select', className)} />

/* Mini progress bar used in encounter rows. */
export const Progress = ({ done, total = 15, width = 48 }: { done: number; total?: number; width?: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1 overflow-hidden rounded-sm bg-select" style={{ width }}>
      <motion.div className="h-1 rounded-sm bg-primary" initial={{ width: 0 }} animate={{ width: (done / total) * width }} transition={{ duration: 0.6, ease }} />
    </div>
    <span className="font-mono text-mono text-ink-3">
      {done}/{total}
    </span>
  </div>
)

/* Staggered reveal for page content. */
export const Reveal = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease }}>
    {children}
  </motion.div>
)

export function Field({ label, error, hint, children, right }: { label: string; error?: string; hint?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm text-ink-2">
        {label}
        {right}
      </span>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 block text-cap text-rag-red">
            {error}
          </motion.span>
        ) : hint ? (
          <span className="mt-1.5 block text-cap text-ink-3">{hint}</span>
        ) : null}
      </AnimatePresence>
    </label>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  const { brand } = useStore()
  if (brand === 'blue') {
    const u = size / 3
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <rect x={0} y={u} width={1.5 * u} height={u} rx={u / 2} fill="#0B6FB8" />
        <rect x={u} y={1.5 * u} width={u} height={1.5 * u} rx={u / 2} fill="#0B6FB8" />
        <rect x={u} y={0} width={u} height={1.5 * u} rx={u / 2} fill="#0596B5" />
        <rect x={1.5 * u} y={u} width={1.5 * u} height={u} rx={u / 2} fill="#0596B5" />
        <rect x={u} y={u} width={u} height={u} fill="#034487" />
      </svg>
    )
  }
  return (
    <span style={{ width: size, height: size }} className="inline-flex items-center justify-center rounded-xs bg-primary text-sm font-medium text-primary-on">
      L
    </span>
  )
}

export const EmptyState = ({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-select text-ink-2">{icon}</div>
    <p className="text-sm font-medium">{title}</p>
    <p className="mt-1 max-w-[280px] text-cap text-ink-3">{body}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)
