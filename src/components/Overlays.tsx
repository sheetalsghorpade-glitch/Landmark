import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, BookOpen, Calendar, Check, CheckCheck, CornerDownLeft, FileText, Keyboard, LogOut, MapPin, MessageSquare,
  Palette, PlayCircle, RotateCcw, Search, Sparkles, User, Users, X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { briefSources, patientById, patients, type Role, type TaskStatus } from '../data/mock'
import { useStore, type Brand } from '../store'
import { Avatar, Button, Drawer, Field, Kbd, Logo, Modal, Segmented, cx, ease, popMotion, useOutside } from './ui'

/* ⌘K command palette: patients, encounters, tasks and pages. */
function SearchPalette() {
  const { overlay, close, encounters, tasks, open } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const isOpen = overlay === 'search'

  useEffect(() => {
    if (isOpen) {
      setQ('')
      setActive(0)
    }
  }, [isOpen])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    const pages = [
      { group: 'Go to', label: 'Home', sub: 'Your day', to: '/home', icon: ArrowRight },
      { group: 'Go to', label: 'Care gaps', sub: 'Patients', to: '/patients', icon: Users },
      { group: 'Go to', label: 'Tasks', sub: 'Board and list', to: '/tasks', icon: Check },
      { group: 'Go to', label: 'Calendar', sub: 'This week', to: '/calendar', icon: Calendar },
      { group: 'Go to', label: 'Coding review', sub: 'Returned encounters', to: '/coding', icon: FileText },
    ]
    const pts = patients.map((p) => ({ group: 'Patients', label: p.name, sub: `MRN ${p.mrn} · ${p.age} · ${p.town}`, to: `/patients/${p.id}`, icon: User }))
    const ens = encounters.map((e) => ({
      group: 'Encounters',
      label: `${patientById(e.patientId).name} · ${e.type}`,
      sub: `${e.date} · ${e.done}/15 sections`,
      to: e.status === 'returned' ? `/coding?e=${e.id}` : `/encounter/${e.id}`,
      icon: FileText,
    }))
    const tks = tasks.map((t) => ({ group: 'Tasks', label: t.title, sub: `${patientById(t.patientId).name} · ${t.due}`, to: '/tasks', icon: Check }))
    if (!s) return [...pages, ...pts.slice(0, 4)]
    return [...pts, ...ens, ...tks, ...pages].filter((r) => (r.label + ' ' + r.sub).toLowerCase().includes(s)).slice(0, 12)
  }, [q, encounters, tasks])

  const go = (i: number) => {
    const r = results[i]
    if (!r) return
    close()
    navigate(r.to)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        isOpen ? close() : open('search')
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, close, open])

  let lastGroup = ''
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[65] flex items-start justify-center p-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40" onClick={close} />
          <motion.div
            role="dialog"
            aria-label="Search"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className="relative w-full max-w-[640px] overflow-hidden rounded-xl border border-hair bg-canvas shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-hair px-4">
              <Search size={18} className="text-ink-3" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(a + 1, results.length - 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(a - 1, 0))
                  }
                  if (e.key === 'Enter') go(active)
                  if (e.key === 'Escape') close()
                }}
                placeholder="Search patients, MRN, tasks"
                className="h-14 flex-1 bg-transparent text-body outline-none placeholder:text-ink-3"
              />
              <Kbd>Esc</Kbd>
            </div>
            <div className="scroll-thin max-h-[420px] overflow-auto p-2">
              {results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium">No results for “{q}”</p>
                  <p className="mt-1 text-cap text-ink-3">Try a name, an MRN like 1010455, or a task.</p>
                </div>
              )}
              {results.map((r, i) => {
                const header = r.group !== lastGroup
                lastGroup = r.group
                const Icon = r.icon
                return (
                  <div key={r.group + r.label + i}>
                    {header && <div className="px-3 pb-1 pt-3 text-label text-ink-3">{r.group}</div>}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(i)}
                      className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left', i === active && 'bg-select')}
                    >
                      <Icon size={16} className="text-ink-2" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{r.label}</span>
                        <span className="truncate text-cap text-ink-3">{r.sub}</span>
                      </span>
                      <span className="flex-1" />
                      {i === active && <CornerDownLeft size={14} className="text-ink-3" />}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 border-t border-hair px-4 py-2.5 text-cap text-ink-3">
              <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
              <span><Kbd>↵</Kbd> to open</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NotificationsPopover() {
  const { overlay, close, notifications, markAllRead, markRead } = useStore()
  const navigate = useNavigate()
  const ref = useOutside<HTMLDivElement>(overlay === 'notifications', close)
  const unread = notifications.filter((n) => n.unread).length
  return (
    <AnimatePresence>
      {overlay === 'notifications' && (
        <motion.div
          ref={ref}
          {...popMotion}
          role="dialog"
          aria-label="Notifications"
          className="fixed right-4 top-[68px] z-[65] w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-hair bg-canvas shadow-pop lg:right-[200px]"
        >
          <div className="flex items-center gap-2 border-b border-hair px-4 py-3">
            <span className="text-body font-medium">Notifications</span>
            {unread > 0 && <span className="font-mono text-mono text-ink-3">{unread} new</span>}
            <span className="flex-1" />
            <button disabled={!unread} onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-medium text-primary-ink disabled:text-ink-3">
              <CheckCheck size={15} /> Mark all read
            </button>
          </div>
          <ul>
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markRead(n.id)
                    close()
                    navigate(n.to)
                  }}
                  className="flex w-full gap-3 border-b border-hair px-4 py-3 text-left transition-colors last:border-0 hover:bg-select/60"
                >
                  <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.unread ? 'bg-primary' : 'bg-transparent')} />
                  <span className="flex flex-col gap-0.5">
                    <span className={cx('text-sm', n.unread ? 'font-medium' : 'text-ink-2')}>{n.title}</span>
                    <span className="text-cap text-ink-3">{n.body}</span>
                    <span className="font-mono text-[11px] text-ink-3">{n.time}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HelpDrawer() {
  const { overlay, close, setTourStep, setFirstRun } = useStore()
  const navigate = useNavigate()
  const items = [
    { icon: PlayCircle, title: 'Replay the tour', body: 'Three steps on Home: needs you now, day plan, next step.', run: () => { close(); setFirstRun(false); navigate('/home'); setTimeout(() => setTourStep(0), 350) } },
    { icon: Keyboard, title: 'Keyboard shortcuts', body: '⌘K search · Esc closes any panel · ↑ ↓ to move in lists', run: undefined },
    { icon: BookOpen, title: 'How Landmark Assist works', body: 'It drafts, you decide. Every point links to its source, and nothing saves until you sign.', run: undefined },
    { icon: MessageSquare, title: 'Contact support', body: 'support@landmarkhealth.example · weekdays 7:00 to 19:00', run: undefined },
  ]
  return (
    <Drawer open={overlay === 'help'} onClose={close} width={420} label="Help">
      <div className="flex items-center justify-between border-b border-hair px-6 py-5">
        <h2 className="text-sub">Help</h2>
        <button aria-label="Close" onClick={close} className="rounded-xs p-1 text-ink-2 hover:bg-select"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-3 p-6">
        {items.map((it) => (
          <button
            key={it.title}
            onClick={it.run}
            disabled={!it.run}
            className={cx('flex gap-3 rounded-lg border border-hair p-4 text-left transition-colors', it.run && 'hover:border-hair-strong hover:bg-select/50')}
          >
            <it.icon size={18} className="mt-0.5 shrink-0 text-ink-2" />
            <span>
              <span className="block text-sm font-medium">{it.title}</span>
              <span className="mt-0.5 block text-cap text-ink-3">{it.body}</span>
            </span>
          </button>
        ))}
      </div>
    </Drawer>
  )
}

function AccountMenu() {
  const { overlay, close, role, setRole, toast, reset } = useStore()
  const navigate = useNavigate()
  const ref = useOutside<HTMLDivElement>(overlay === 'account', close)
  const roles: { v: Role; label: string; to: string }[] = [
    { v: 'provider', label: 'Provider', to: '/home' },
    { v: 'nurse', label: 'Nurse care manager', to: '/patients' },
    { v: 'coder', label: 'Medical coder', to: '/coding' },
  ]
  return (
    <AnimatePresence>
      {overlay === 'account' && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.16, ease }}
          className="fixed bottom-20 left-3 z-[75] w-[260px] rounded-xl border border-hair bg-canvas p-1.5 shadow-pop"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar initials="MW" dark />
            <div>
              <div className="text-sm font-medium">Dr Michael Wong</div>
              <div className="text-cap text-ink-3">m.wong@landmarkhealth.example</div>
            </div>
          </div>
          <div className="px-2.5 pb-1 pt-2 text-label text-ink-3">Switch role</div>
          {roles.map((r) => (
            <button
              key={r.v}
              onClick={() => {
                setRole(r.v)
                close()
                navigate(r.to)
                toast(`Switched to ${r.label}`)
              }}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-select"
            >
              {r.label}
              {role === r.v && <Check size={14} className="text-primary-ink" />}
            </button>
          ))}
          <div className="my-1 border-t border-hair" />
          <button onClick={() => { close(); navigate('/settings') }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-select">
            <User size={15} className="text-ink-2" /> Profile and settings
          </button>
          <button onClick={() => { close(); reset(); navigate('/signin') }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-select">
            <LogOut size={15} className="text-ink-2" /> Sign out
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LocationModal() {
  const { overlay, close, location, setLocation, toast } = useStore()
  const [sel, setSel] = useState(location)
  useEffect(() => setSel(location), [location, overlay])
  const sites = [
    { name: 'Buffalo, NY', sub: 'Home-based care · 212 patients' },
    { name: 'Rochester, NY', sub: 'Home-based care · 164 patients' },
    { name: 'Syracuse, NY', sub: 'Home-based care · 98 patients' },
  ]
  return (
    <Modal
      open={overlay === 'location'}
      onClose={close}
      title="Switch location"
      width={440}
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={() => { setLocation(sel); close(); if (sel !== location) toast(`Now working in ${sel}`) }}>Switch</Button>
        </>
      }
    >
      <div role="radiogroup" className="flex flex-col gap-2">
        {sites.map((s) => (
          <button
            key={s.name}
            role="radio"
            aria-checked={sel === s.name}
            onClick={() => setSel(s.name)}
            className={cx('flex items-center gap-3 rounded-lg border p-3 text-left transition-colors', sel === s.name ? 'border-ink' : 'border-hair hover:border-hair-strong')}
          >
            <MapPin size={16} className="text-ink-2" />
            <span className="flex-1">
              <span className="block text-sm font-medium">{s.name}</span>
              <span className="block text-cap text-ink-3">{s.sub}</span>
            </span>
            <span className={cx('flex size-4 items-center justify-center rounded-full border', sel === s.name ? 'border-primary' : 'border-hair-strong')}>
              {sel === s.name && <span className="size-2 rounded-full bg-primary" />}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function NewEncounterDialog() {
  const { overlay, close, overlayData, addEncounter, toast } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState<'patient' | 'details'>('patient')
  const [pid, setPid] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('Maintenance visit')
  const [place, setPlace] = useState<'Home' | 'Telephonic'>('Home')
  const isOpen = overlay === 'newEncounter'
  useEffect(() => {
    if (isOpen) {
      const preset = overlayData.patientId as string | undefined
      setPid(preset ?? null)
      setStep(preset ? 'details' : 'patient')
      setQ('')
    }
  }, [isOpen, overlayData])
  const list = patients.filter((p) => (p.name + p.mrn).toLowerCase().includes(q.toLowerCase()))
  const start = () => {
    const id = 'n' + Date.now()
    addEncounter({ id, patientId: pid!, type, date: '16 Jan 2017', status: 'open', done: 0, nextStep: 'Resume', closesIn: '24 hrs left' })
    close()
    toast(`Encounter started for ${patientById(pid!).name}`)
    navigate(`/encounter/${id}?step=1`)
  }
  return (
    <Modal
      open={isOpen}
      onClose={close}
      eyebrow={step === 'patient' ? 'Step 1 of 2' : 'Step 2 of 2'}
      title={step === 'patient' ? 'Choose a patient' : 'Visit details'}
      width={520}
      footer={
        step === 'patient' ? (
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={!pid} onClick={() => setStep('details')}>Continue</Button>
          </>
        ) : (
          <>
            {!overlayData.patientId && <Button variant="ghost" onClick={() => setStep('patient')}>Back</Button>}
            <span className="flex-1" />
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" onClick={start}>Start encounter</Button>
          </>
        )
      }
    >
      {step === 'patient' ? (
        <div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or MRN" className="field pl-9" />
          </div>
          <div className="scroll-thin max-h-[300px] overflow-auto rounded-lg border border-hair">
            {list.length === 0 && <p className="px-4 py-8 text-center text-cap text-ink-3">No patient matches “{q}”.</p>}
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => setPid(p.id)}
                onDoubleClick={() => { setPid(p.id); setStep('details') }}
                className={cx('flex w-full items-center gap-3 border-b border-hair px-3 py-2.5 text-left last:border-0', pid === p.id ? 'bg-wash' : 'hover:bg-select/60')}
              >
                <Avatar initials={p.initials} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="block font-mono text-[11.5px] text-ink-3">MRN {p.mrn} · {p.age} yrs · {p.town}</span>
                </span>
                {pid === p.id && <Check size={16} className="text-primary-ink" />}
              </button>
            ))}
          </div>
        </div>
      ) : (
        pid && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-select p-3">
              <Avatar initials={patientById(pid).initials} className="bg-canvas" />
              <div>
                <div className="text-sm font-medium">{patientById(pid).name}</div>
                <div className="font-mono text-[11.5px] text-ink-3">MRN {patientById(pid).mrn} · {patientById(pid).address}</div>
              </div>
            </div>
            <Field label="Visit type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="field">
                {['Maintenance visit', 'Annual visit', 'Follow-up', 'Urgent visit', 'Informational visit'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div>
              <div className="mb-1.5 text-sm text-ink-2">Where</div>
              <Segmented id="place" value={place} onChange={setPlace} options={[{ value: 'Home', label: 'In the home' }, { value: 'Telephonic', label: 'Telephonic' }]} />
            </div>
            {patientById(pid).safety && (
              <div className="rounded-lg border border-rag-red/30 bg-red-wash p-3 text-sm text-rag-red">
                <span className="font-medium">Before you go:</span> {patientById(pid).safety}. {patientById(pid).codeStatus}.
              </div>
            )}
          </div>
        )
      )}
    </Modal>
  )
}

function NewTaskDialog() {
  const { overlay, close, overlayData, addTask, toast } = useStore()
  const navigate = useNavigate()
  const isOpen = overlay === 'newTask'
  const [title, setTitle] = useState('')
  const [pid, setPid] = useState('')
  const [due, setDue] = useState('Today')
  const [owner, setOwner] = useState('YO')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [tried, setTried] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setTitle((overlayData.title as string) ?? '')
      setPid((overlayData.patientId as string) ?? '')
      setStatus((overlayData.status as TaskStatus) ?? 'todo')
      setDue('Today')
      setOwner('YO')
      setTried(false)
    }
  }, [isOpen, overlayData])
  const errors = { title: !title.trim() ? 'Give the task a short title' : '', pid: !pid ? 'Choose the patient this is for' : '' }
  const save = () => {
    setTried(true)
    if (errors.title || errors.pid) return
    addTask({ title: title.trim(), patientId: pid, due, owner, status })
    close()
    toast('Task created', { label: 'View', run: () => navigate('/tasks') })
  }
  return (
    <Modal
      open={isOpen}
      onClose={close}
      title="New task"
      width={480}
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={save}>Create task</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Title" error={tried ? errors.title : ''}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example, call Mary about evening doses" className={cx('field', tried && errors.title && '!border-rag-red')} />
        </Field>
        <Field label="Patient" error={tried ? errors.pid : ''}>
          <select value={pid} onChange={(e) => setPid(e.target.value)} className={cx('field', tried && errors.pid && '!border-rag-red')}>
            <option value="">Choose a patient</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due">
            <select value={due} onChange={(e) => setDue(e.target.value)} className="field">
              {['Today', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20', 'Mon 23'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Owner">
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="field">
              <option value="YO">You</option>
              <option value="KW">Kay Williams, RN</option>
              <option value="FD">Fiona Doyle</option>
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}

function MessageDrawer() {
  const { overlay, close, overlayData, toast } = useStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [tried, setTried] = useState(false)
  const isOpen = overlay === 'message'
  useEffect(() => {
    if (isOpen) {
      setText('')
      setTried(false)
    }
  }, [isOpen])
  const p = patientById((overlayData.patientId as string) ?? 'js')
  const thread = [
    { me: false, who: 'Kay Williams, RN', when: '12 Jan · 16:40', text: 'Mary says John missed two evening warfarin doses, then took a double dose on Tuesday.' },
    { me: true, who: 'You', when: '12 Jan · 17:05', text: 'Thanks Kay. Can you set up a repeat INR before Monday?' },
    { me: false, who: 'Kay Williams, RN', when: '13 Jan · 09:12', text: 'Done. Lab is booked for Tuesday morning, kit is with Mary.' },
  ]
  const send = () => {
    setTried(true)
    if (!text.trim()) return
    setSending(true)
    setTimeout(() => {
      setSending(false)
      close()
      toast('Message sent to Kay Williams')
    }, 700)
  }
  return (
    <Drawer open={isOpen} onClose={close} width={460} label="Message care manager">
      <div className="flex items-start justify-between border-b border-hair px-6 py-5">
        <div>
          <div className="text-label text-ink-2">About {p.name}</div>
          <h2 className="mt-1 text-sub">Message care manager</h2>
        </div>
        <button aria-label="Close" onClick={close} className="rounded-xs p-1 text-ink-2 hover:bg-select"><X size={18} /></button>
      </div>
      <div className="scroll-thin flex flex-1 flex-col gap-4 overflow-auto px-6 py-5">
        {thread.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={cx('max-w-[85%]', m.me && 'self-end')}>
            <div className="mb-1 text-cap text-ink-3">{m.who} · {m.when}</div>
            <div className={cx('rounded-lg px-3.5 py-2.5 text-sm', m.me ? 'bg-ink text-white' : 'bg-select')}>{m.text}</div>
          </motion.div>
        ))}
      </div>
      <div className="border-t border-hair p-4">
        <Field label="Reply to Kay Williams, RN" error={tried && !text.trim() ? 'Write a message before sending' : ''}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Write a message" className={cx('field h-auto resize-none py-2.5', tried && !text.trim() && '!border-rag-red')} />
        </Field>
        <div className="mt-3 flex justify-end">
          <Button variant="primary" loading={sending} onClick={send}>Send</Button>
        </div>
      </div>
    </Drawer>
  )
}

export function VisitBrief() {
  const { overlay, close, overlayData, toast } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<null | 'yes' | 'no'>(null)
  const isOpen = overlay === 'brief'
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setFeedback(null)
      const t = setTimeout(() => setLoading(false), 900)
      return () => clearTimeout(t)
    }
  }, [isOpen])
  const Src = ({ children }: { children: string }) => (
    <button onClick={() => toast(`Opened source: ${children}`)} className="mt-2 rounded-xs border border-hair-strong px-2 py-0.5 font-mono text-mono text-ink-2 transition-colors hover:border-ink hover:text-ink">
      {children}
    </button>
  )
  const block = (title: string, items: { t: string; s?: string[] }[], delay: number) => (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }} className="border-b border-hair py-5 last:border-0">
      <h3 className="mb-3 text-sm text-ink-2">{title}</h3>
      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <div key={it.t}>
            <p className="text-body">{it.t}</p>
            {it.s && <div className="flex flex-wrap gap-2">{it.s.map((s) => <Src key={s}>{s}</Src>)}</div>}
          </div>
        ))}
      </div>
    </motion.section>
  )
  return (
    <Drawer open={isOpen} onClose={close} width={640} label="Visit brief">
      <div className="flex items-start justify-between px-6 pt-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink-2"><Sparkles size={14} className="text-ink" /> Drafted by Landmark Assist</div>
          <h2 className="mt-1 text-sub">Visit brief · John Smith</h2>
          <p className="mt-1 text-sm text-ink-3">For today, 15:00 · read in about a minute</p>
        </div>
        <Button size="sm" onClick={close}>Close</Button>
      </div>
      <div className="scroll-thin flex-1 overflow-auto px-6">
        {loading ? (
          <div className="flex flex-col gap-3 py-8">
            <div className="flex items-center gap-2 text-sm text-ink-3"><span className="size-2 animate-pulse rounded-full bg-primary" /> Reading 9 sources…</div>
            {[90, 70, 80, 60, 75].map((w, i) => <div key={i} className="h-4 animate-pulse rounded-xs bg-select" style={{ width: w + '%' }} />)}
          </div>
        ) : (
          <>
            {block('What changed since 05 Jan', [
              { t: 'INR 3.8 on 13 Jan, up from 2.6 at the last visit.', s: ['Lab · 13 Jan'] },
              { t: 'Mary says he missed two evening warfarin doses, then took a double dose.', s: ['Message · Kay · 12 Jan'] },
              { t: 'New confusion in the evenings. Memory clinic referral is in.', s: ['Problem list · 11 Jan', 'Task · done'] },
            ], 0)}
            {block('Worth asking', [{ t: 'Any bleeding, bruising or falls since 11 Jan?' }, { t: 'Who sets out the evening tablets now, John or Mary?' }], 0.08)}
            {block('Before you leave', [
              { t: "Repeat INR at today's visit. Kay has the kit ready.", s: ['Task · Kay'] },
              { t: 'Medication reconciliation is overdue. Last done 21 Jun 2016.', s: ['Medications'] },
            ], 0.16)}
          </>
        )}
      </div>
      <div className="border-t border-hair px-6 py-4">
        <p className="mb-3 text-cap text-ink-3">Every point links to its source. Assist reads the chart but never changes it.</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-3">Was this useful?</span>
          {(['yes', 'no'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFeedback(f); toast('Thanks, that helps Assist improve') }}
              className={cx('rounded-xs px-2 py-1 text-sm capitalize transition-colors', feedback === f ? 'bg-ink text-white' : 'text-ink hover:bg-select')}
            >
              {f}
            </button>
          ))}
          <span className="flex-1" />
          <Button variant="primary" onClick={() => { close(); navigate('/encounter/e1?step=7') }}>Start encounter</Button>
        </div>
      </div>
    </Drawer>
  )
}

/* Floating control for the portfolio demo: brand variation and reset. */
export function DemoDock() {
  const { brand, setBrand, reset, toast } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false))
  const brands: { v: Brand; label: string; c: string }[] = [
    { v: 'green', label: 'Green', c: '#0f6b34' },
    { v: 'yellow', label: 'Yellow', c: '#FFCF33' },
    { v: 'blue', label: 'Blue', c: '#0B6FB8' },
  ]
  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-[50]">
      <AnimatePresence>
        {open && (
          <motion.div {...popMotion} className="absolute bottom-[calc(100%+8px)] right-0 w-[248px] rounded-xl border border-hair bg-canvas p-3 shadow-pop">
            <div className="mb-2 text-label text-ink-2">Brand variation</div>
            <div className="grid grid-cols-3 gap-1.5">
              {brands.map((b) => (
                <button
                  key={b.v}
                  onClick={() => setBrand(b.v)}
                  aria-pressed={brand === b.v}
                  className={cx('flex flex-col items-center gap-1.5 rounded-md border py-2 text-cap transition-colors', brand === b.v ? 'border-ink' : 'border-hair hover:border-hair-strong')}
                >
                  <span className="size-5 rounded-full" style={{ background: b.c }} />
                  {b.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ink-3">One set of design tokens drives all three. Status colours stay red, amber and green.</p>
            <div className="my-3 border-t border-hair" />
            <button
              onClick={() => { reset(); setOpen(false); navigate('/signin'); toast('Demo restarted') }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-select"
            >
              <RotateCcw size={15} className="text-ink-2" /> Restart from sign in
            </button>
            <button onClick={() => { setOpen(false); navigate('/home') }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-select">
              <ArrowRight size={15} className="text-ink-2" /> Skip to Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-hair bg-canvas py-2 pl-2.5 pr-3.5 text-sm font-medium shadow-pop"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-select"><Palette size={14} /></span>
        Demo
      </motion.button>
    </div>
  )
}

export function Overlays() {
  return (
    <>
      <SearchPalette />
      <NotificationsPopover />
      <HelpDrawer />
      <AccountMenu />
      <LocationModal />
      <NewEncounterDialog />
      <NewTaskDialog />
      <MessageDrawer />
      <VisitBrief />
    </>
  )
}

export { Logo, briefSources }
