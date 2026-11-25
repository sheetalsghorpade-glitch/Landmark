import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, Calendar, ChevronDown, CircleHelp, FileText, Home, LayoutGrid, List, Menu, Plus, Search, Settings, Users, X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar, Kbd, Logo, cx, ease } from './ui'

const nav = [
  { to: '/home', label: 'Home', icon: Home, count: 'home' },
  { to: '/patients', label: 'Patients', icon: Users, count: 'patients' },
  { to: '/tasks', label: 'Tasks', icon: List, count: 'tasks' },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/coding', label: 'Coding review', icon: FileText, count: 'coding' },
  { to: '/metrics', label: 'Metrics', icon: LayoutGrid },
] as const

function NavItem({ to, label, icon: Icon, count, onNavigate }: { to: string; label: string; icon: typeof Home; count?: number; onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          'group relative flex h-9 items-center gap-2.5 rounded-xs px-2.5 text-sm transition-colors',
          isActive ? 'font-medium text-primary-ink' : 'text-ink hover:bg-canvas/60',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span layoutId="nav-active" transition={{ type: 'spring', stiffness: 500, damping: 40 }} className="absolute inset-0 rounded-xs border border-hair bg-canvas shadow-nav" />
          )}
          <Icon size={18} strokeWidth={1.6} className={cx('relative', isActive ? 'text-primary-ink' : 'text-ink-2 group-hover:text-ink')} />
          <span className="relative">{label}</span>
          <span className="flex-1" />
          {count !== undefined && <span className="relative font-mono text-mono font-normal text-ink-2">{count}</span>}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { encounters, tasks, open, location, role } = useStore()
  const navigate = useNavigate()
  const counts: Record<string, number> = {
    home: encounters.filter((e) => e.status === 'open' || e.status === 'returned').length - 1,
    patients: 212,
    tasks: tasks.filter((t) => t.owner === 'YO' && t.status !== 'done').length,
    coding: encounters.filter((e) => e.status === 'returned').length,
  }
  const roleLabel = { provider: 'Provider', nurse: 'Nurse care manager', coder: 'Medical coder' }[role]
  return (
    <div className="flex h-full w-[240px] flex-col gap-[2px] border-r border-hair-strong bg-sidebar px-3 py-4">
      <div className="flex items-center gap-2.5 px-2 pb-4 pt-1">
        <Logo />
        <span className="text-body font-medium">Landmark</span>
        <span className="text-label text-ink-2">EMR</span>
      </div>
      <button
        onClick={() => open('location')}
        className="flex w-full items-center gap-2 rounded-xs border border-hair bg-canvas px-2.5 py-2 text-left transition-colors hover:border-hair-strong"
      >
        <span className="flex flex-col">
          <span className="text-sm font-medium">{location}</span>
          <span className="text-cap text-ink-3">Home-based care</span>
        </span>
        <span className="flex-1" />
        <ChevronDown size={16} className="text-ink-2" />
      </button>
      <div className="pb-1.5 pl-2.5 pt-5 text-label text-ink-2">Workspace</div>
      {nav.map((n) => (
        <NavItem key={n.to} to={n.to} label={n.label} icon={n.icon} count={'count' in n ? counts[n.count] : undefined} onNavigate={onNavigate} />
      ))}
      <div className="pb-1.5 pl-2.5 pt-5 text-label text-ink-2">Saved views</div>
      {[
        { label: 'Acuity B panel', to: '/patients?acuity=B' },
        { label: 'Returned this week', to: '/coding' },
      ].map((v) => (
        <button
          key={v.label}
          onClick={() => {
            navigate(v.to)
            onNavigate?.()
          }}
          className="flex h-8 items-center gap-2.5 rounded-xs px-2.5 text-left text-sm transition-colors hover:bg-canvas/60"
        >
          <span className="size-2 rounded-[2px] bg-ink-faint" />
          {v.label}
        </button>
      ))}
      <div className="flex-1" />
      <NavItem to="/settings" label="Settings" icon={Settings} onNavigate={onNavigate} />
      <button onClick={() => open('help')} className="group flex h-9 items-center gap-2.5 rounded-xs px-2.5 text-sm transition-colors hover:bg-canvas/60">
        <CircleHelp size={18} strokeWidth={1.6} className="text-ink-2 group-hover:text-ink" />
        Help
      </button>
      <button onClick={() => open('account')} className="mt-1 flex items-center gap-2.5 border-t border-hair px-2 pt-3 text-left">
        <Avatar initials="MW" dark />
        <span className="flex flex-col">
          <span className="text-sm font-medium">Dr Michael Wong</span>
          <span className="text-cap text-ink-3">{roleLabel}</span>
        </span>
        <span className="flex-1" />
        <ChevronDown size={16} className="text-ink-2" />
      </button>
    </div>
  )
}

export function Topbar({ crumbs, actions }: { crumbs: { label: string; to?: string }[]; actions?: ReactNode }) {
  const { open, notifications } = useStore()
  const navigate = useNavigate()
  const unread = notifications.filter((n) => n.unread).length
  const [mobileNav, setMobileNav] = useState(false)
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hair bg-canvas px-4 lg:px-8">
        <button aria-label="Open menu" onClick={() => setMobileNav(true)} className="-ml-1 rounded-xs p-1.5 text-ink-2 hover:bg-select lg:hidden">
          <Menu size={20} />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          {crumbs.map((c, i) => (
            <span key={i} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span className="text-ink-3">/</span>}
              {c.to ? (
                <button onClick={() => navigate(c.to!)} className="truncate text-ink-3 transition-colors hover:text-ink">
                  {c.label}
                </button>
              ) : (
                <span className={cx('truncate', i === crumbs.length - 1 ? 'font-medium text-ink' : 'text-ink-3')}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex-1" />
        <button
          onClick={() => open('search')}
          className="hidden h-9 w-[320px] items-center gap-2 rounded-xs bg-select px-3 text-sm text-ink-3 transition-colors hover:bg-hair/70 md:flex"
        >
          <Search size={16} />
          Search patients, MRN, tasks
          <span className="flex-1" />
          <Kbd>⌘K</Kbd>
        </button>
        <button aria-label="Search" onClick={() => open('search')} className="flex size-9 items-center justify-center rounded-xs border border-hair-strong md:hidden">
          <Search size={18} />
        </button>
        <button
          aria-label={`Notifications, ${unread} unread`}
          onClick={() => open('notifications')}
          className="relative flex size-9 items-center justify-center rounded-xs border border-hair-strong text-ink transition-colors hover:bg-select"
        >
          <Bell size={18} strokeWidth={1.6} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                className="absolute -top-[7px] left-6 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-canvas bg-ink px-1 text-[10px] font-semibold leading-4 text-white"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        {actions ?? (
          <button
            onClick={() => open('newEncounter')}
            className="hidden items-center gap-2 rounded-xs border border-hair-strong bg-canvas px-[13px] py-2 text-sm font-medium transition-colors hover:bg-select sm:flex"
          >
            <Plus size={16} />
            New encounter
          </button>
        )}
      </header>
      <AnimatePresence>
        {mobileNav && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileNav(false)} />
            <motion.div className="absolute inset-y-0 left-0" initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.28, ease }}>
              <Sidebar onNavigate={() => setMobileNav(false)} />
              <button aria-label="Close menu" onClick={() => setMobileNav(false)} className="absolute -right-11 top-4 rounded-full bg-canvas p-2 shadow-pop">
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function Page({ crumbs, children, actions, className }: { crumbs: { label: string; to?: string }[]; children: ReactNode; actions?: ReactNode; className?: string }) {
  const loc = useLocation()
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <Topbar crumbs={crumbs} actions={actions} />
      <motion.main
        key={loc.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease }}
        className={cx('scroll-thin min-h-0 flex-1 overflow-auto px-4 pb-20 pt-6 lg:px-8', className)}
      >
        {children}
      </motion.main>
    </div>
  )
}
