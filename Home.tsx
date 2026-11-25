import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, Check, ChevronRight, Clock, FileText, Filter, List, Search, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Avatar, Button, Card, CardHeader, EmptyState, IconButton, Logo, Modal, Progress, RagChip, Reveal, Segmented, cx, ease, popMotion, useOutside } from '../components/ui'
import { patientById, visits, type Encounter } from '../data/mock'
import { statusMeta, useStore } from '../store'

type Range = 'today' | 'week' | 'month'
type Filter = 'all' | 'open' | 'returned' | 'ready'

const kpis: Record<Range, { label: string; value: string; delta: number; foot: string; spark: number[]; to?: string }[]> = {
  today: [
    { label: 'Visits today', value: '6', delta: 1, foot: '24 this week, 4 days to go', spark: [] },
    { label: 'Open encounters', value: '3', delta: -2, foot: '1 closes today', spark: [8, 6, 7, 5, 6, 3], to: 'open' },
    { label: 'Returned by coding', value: '2', delta: 1, foot: 'oldest waiting 12 days', spark: [2, 2, 1, 3, 1, 2], to: '/coding' },
    { label: 'Panel gaps', value: '14', delta: -5, foot: 'acuity B, last 30 days', spark: [22, 21, 19, 18, 17, 14], to: '/patients' },
  ],
  week: [
    { label: 'Visits this week', value: '24', delta: 3, foot: '6 done, 18 to go', spark: [] },
    { label: 'Open encounters', value: '5', delta: -1, foot: '2 close by Friday', spark: [9, 8, 7, 6, 6, 5], to: 'open' },
    { label: 'Returned by coding', value: '3', delta: 1, foot: 'average 4 days to fix', spark: [1, 2, 2, 3, 2, 3], to: '/coding' },
    { label: 'Panel gaps', value: '31', delta: -8, foot: 'acuity B, this week', spark: [44, 41, 39, 36, 33, 31], to: '/patients' },
  ],
  month: [
    { label: 'Visits this month', value: '46', delta: 4, foot: '4 more than December', spark: [] },
    { label: 'Notes closed in 24 h', value: '82%', delta: 18, foot: 'up from 64%', spark: [64, 70, 68, 75, 73, 82], to: '/metrics' },
    { label: 'Returned by coding', value: '6%', delta: -4, foot: '3 of 46 notes', spark: [10, 9, 8, 8, 7, 6], to: '/coding' },
    { label: 'Care gaps closed', value: '31', delta: 12, foot: '9 still open', spark: [12, 16, 19, 24, 27, 31], to: '/patients' },
  ],
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 72},${22 - ((p - min) / (max - min || 1)) * 20}`).join(' ')
  return (
    <svg width={72} height={24} className="overflow-visible">
      <motion.polyline points={d} fill="none" stroke="rgb(var(--ink))" strokeWidth={1.3} strokeLinejoin="round" initial={{ pathLength: 0 } as never} animate={{ pathLength: 1 } as never} transition={{ duration: 0.8, ease }} />
    </svg>
  )
}

function WeekBars() {
  const h = [24, 20, 16, 24, 12]
  return (
    <div className="flex items-end gap-1">
      {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-[3px]">
          <motion.div initial={{ height: 0 }} animate={{ height: h[i] }} transition={{ delay: i * 0.05, duration: 0.5, ease }} className={cx('w-[10px] rounded-[2px]', i === 0 ? 'bg-primary' : 'bg-hair-strong')} />
          <span className={cx('text-cap', i === 0 ? 'text-primary-ink' : 'text-ink-3')}>{d}</span>
        </div>
      ))}
    </div>
  )
}

function EncountersCard({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter) => void }) {
  const { encounters } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [sort, setSort] = useState<'suggested' | 'priority' | 'date' | 'name'>('suggested')
  const [sortOpen, setSortOpen] = useState(false)
  const [all, setAll] = useState(false)
  const sortRef = useOutside<HTMLDivElement>(sortOpen, () => setSortOpen(false))
  const mine = encounters.filter((e) => e.status !== 'coded')
  const count = (f: Filter) => (f === 'all' ? 16 : mine.filter((e) => e.status === f).length)
  const order = { open: 0, returned: 1, ready: 2, coded: 3 }
  const rows = useMemo(() => {
    let r = mine.filter((e) => filter === 'all' || e.status === filter)
    if (q) r = r.filter((e) => patientById(e.patientId).name.toLowerCase().includes(q.toLowerCase()))
    if (sort === 'priority') r = [...r].sort((a, b) => order[a.status] - order[b.status])
    if (sort === 'name') r = [...r].sort((a, b) => patientById(a.patientId).name.localeCompare(patientById(b.patientId).name))
    if (sort === 'date') r = [...r].sort((a, b) => +new Date(b.date) - +new Date(a.date))
    return r
  }, [mine, filter, q, sort])
  const shown = all ? rows : rows.slice(0, 5)
  const openRow = (e: Encounter) => {
    if (e.status === 'open') navigate(`/encounter/${e.id}?step=${Math.min(e.done + 1, 15)}`)
    else if (e.status === 'returned') navigate(`/coding?e=${e.id}`)
    else navigate(`/coding?tab=with&e=${e.id}`)
  }
  return (
    <Card data-tour="encounters" className="flex min-h-[414px] min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-hair px-5 py-3.5">
        <h2 className="text-body font-medium">Encounters</h2>
        <span className="font-mono text-mono text-ink-3">16</span>
        <div className="flex-1" />
        <Segmented
          id="enc-filter"
          value={filter}
          onChange={setFilter}
          options={(['all', 'open', 'returned', 'ready'] as Filter[]).map((f) => ({ value: f, label: `${f[0].toUpperCase() + f.slice(1)} ${count(f)}` }))}
        />
        <AnimatePresence initial={false}>
          {searching && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 180, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by patient" className="h-8 w-[180px] rounded-xs border border-hair-strong px-2.5 text-sm outline-none focus:border-ink" />
            </motion.div>
          )}
        </AnimatePresence>
        <IconButton label={searching ? 'Close search' : 'Search encounters'} onClick={() => { setSearching((s) => !s); setQ('') }}>
          {searching ? <X size={16} /> : <Search size={16} />}
        </IconButton>
        <div ref={sortRef} className="relative">
          <IconButton label="Sort" onClick={() => setSortOpen((o) => !o)} className={sortOpen ? 'border-ink text-ink' : ''}>
            <Filter size={16} />
          </IconButton>
          <AnimatePresence>
            {sortOpen && (
              <motion.div {...popMotion} className="absolute right-0 top-10 z-30 w-[200px] rounded-lg border border-hair bg-canvas p-1 shadow-pop">
                <div className="px-3 pb-1 pt-2 text-label text-ink-3">Sort by</div>
                {([['suggested', 'Suggested'], ['priority', 'Needs action first'], ['date', 'Most recent'], ['name', 'Patient name']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => { setSort(v); setSortOpen(false) }} className="flex w-full items-center justify-between rounded-xs px-3 py-2 text-sm hover:bg-select">
                    {l}
                    {sort === v && <Check size={14} className="text-primary-ink" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="hidden gap-3.5 border-b border-hair px-5 py-[9px] text-label text-ink-2 md:flex">
        <span className="flex-1">Patient</span>
        <span className="w-[92px]">Date</span>
        <span className="w-[160px]">Status</span>
        <span className="w-[96px]">Progress</span>
        <span className="w-[128px]">Next step</span>
        <span className="w-4" />
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.length === 0 && (
            <EmptyState icon={<Search size={18} />} title="No encounters match" body={q ? `Nothing for “${q}” in this view.` : 'Nothing in this view right now.'} action={<Button size="sm" onClick={() => { setQ(''); setFilter('all') }}>Show all</Button>} />
          )}
          {shown.map((e, i) => {
            const p = patientById(e.patientId)
            const s = statusMeta[e.status]
            const muted = e.status === 'ready'
            return (
              <motion.button
                layout
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                exit={{ opacity: 0 }}
                onClick={() => openRow(e)}
                className="group flex min-h-[54px] w-full flex-wrap items-center gap-x-3.5 gap-y-1 border-b border-hair px-5 py-2 text-left transition-colors last:border-0 hover:bg-select/60"
              >
                <span className="flex min-w-[180px] flex-1 items-center gap-3">
                  <Avatar initials={p.initials} />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-cap text-ink-3">{e.type}</span>
                  </span>
                </span>
                <span className="hidden w-[92px] font-mono text-mono text-ink-2 md:block">{e.date}</span>
                <span className="w-[160px]"><RagChip rag={s.rag}>{s.label}</RagChip></span>
                <span className="hidden w-[96px] md:block"><Progress done={e.done} /></span>
                <span className={cx('hidden w-[128px] text-sm md:block', muted ? 'text-ink-3' : 'font-medium')}>
                  {e.status === 'open' && e.closesIn ? `${e.nextStep} · ${e.closesIn}` : e.nextStep}
                </span>
                <ChevronRight size={16} className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 border-t border-hair px-5 py-3">
        <span className="text-cap text-ink-3">Showing {shown.length} of {filter === 'all' ? 16 : rows.length}</span>
        <div className="flex-1" />
        {rows.length > 5 && (
          <button onClick={() => setAll((a) => !a)} className="text-sm font-medium text-primary-ink hover:underline">
            {all ? 'Show fewer' : 'View all encounters'}
          </button>
        )}
      </div>
    </Card>
  )
}

function DayPlan() {
  const navigate = useNavigate()
  const today = visits.filter((v) => v.day === 0).slice(0, 4)
  const drives = ['14 min drive', '22 min drive', '18 min drive']
  return (
    <Card data-tour="dayplan" className="flex w-full shrink-0 flex-col p-5 xl:w-[332px]">
      <CardHeader
        className="pb-3.5"
        title="Day plan"
        count="6 visits · 58 mi"
        right={
          <button aria-label="Open calendar" onClick={() => navigate('/calendar?view=day')} className="rounded-xs p-1 text-ink-2 hover:bg-select hover:text-ink">
            <Calendar size={16} />
          </button>
        }
      />
      {today.map((v, i) => {
        const p = patientById(v.patientId)
        const next = i === 1
        return (
          <div key={v.id}>
            <motion.button
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => navigate(`/patients/${p.id}`)}
              className={cx('flex w-full gap-3 rounded-lg p-2.5 text-left transition-colors', next ? 'bg-wash' : 'hover:bg-select/60')}
            >
              <span className={cx('w-[38px] font-mono text-mono', next ? 'text-primary-ink' : v.done ? 'text-ink-3' : 'text-ink-2')}>{v.start}</span>
              <span className={cx('mt-1 size-3 shrink-0 rounded-full', v.done ? 'bg-ink-faint' : next ? 'bg-primary' : 'border-[1.5px] border-ink-2 bg-canvas')} />
              <span className="flex flex-col gap-0.5">
                <span className={cx('flex items-center gap-2 text-sm font-medium', v.done && 'text-ink-3')}>
                  {p.name}
                  {v.done && <Check size={14} className="text-ink-3" />}
                </span>
                <span className="text-cap text-ink-3">{v.type} visit · {v.town}</span>
                {next && v.flag && <span className="pt-1.5 text-cap text-primary-ink">{v.flag}</span>}
              </span>
            </motion.button>
            {i < 3 && (
              <div className="flex items-center gap-3 pl-2.5">
                <span className="w-[38px]" />
                <span className="flex h-[18px] w-3 justify-center"><span className="w-[1.5px] bg-hair-strong" /></span>
                <span className="text-cap text-ink-3">{drives[i]}</span>
              </div>
            )}
          </div>
        )
      })}
      <div className="flex-1" />
      <div className="mt-3 flex items-center gap-2 rounded-xs bg-select px-3 py-2.5">
        <span className="text-cap text-ink-2">Back in Buffalo by 15:30</span>
        <div className="flex-1" />
        <button onClick={() => navigate('/calendar')} className="text-sm font-medium text-primary-ink hover:underline">See the week</button>
      </div>
    </Card>
  )
}

function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { encounters, toast } = useStore()
  const [what, setWhat] = useState<'encounters' | 'visits'>('encounters')
  const [busy, setBusy] = useState(false)
  const run = () => {
    setBusy(true)
    setTimeout(() => {
      const rows =
        what === 'encounters'
          ? [['Patient', 'Visit', 'Date', 'Status', 'Sections done'], ...encounters.map((e) => [patientById(e.patientId).name, e.type, e.date, statusMeta[e.status].label, `${e.done}/15`])]
          : [['Time', 'Patient', 'Visit', 'Town'], ...visits.filter((v) => v.day === 0).map((v) => [v.start, patientById(v.patientId).name, v.type, v.town])]
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      a.download = `landmark-${what}-16-jan-2017.csv`
      a.click()
      setBusy(false)
      onClose()
      toast('Export downloaded')
    }, 600)
  }
  return (
    <Modal open={open} onClose={onClose} title="Export" width={440} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={run}>Download CSV</Button></>}>
      <p className="mb-4 text-sm text-ink-2">Exports exclude clinical notes. Downloads are logged for audit.</p>
      <div className="flex flex-col gap-2">
        {([['encounters', 'Encounters', 'All 16 with status and progress'], ['visits', "Today's visits", 'Day plan in route order']] as const).map(([v, t, s]) => (
          <button key={v} onClick={() => setWhat(v)} className={cx('flex items-center gap-3 rounded-lg border p-3 text-left transition-colors', what === v ? 'border-ink' : 'border-hair hover:border-hair-strong')}>
            {v === 'encounters' ? <List size={16} className="text-ink-2" /> : <Calendar size={16} className="text-ink-2" />}
            <span className="flex-1"><span className="block text-sm font-medium">{t}</span><span className="block text-cap text-ink-3">{s}</span></span>
            <span className={cx('flex size-4 items-center justify-center rounded-full border', what === v ? 'border-primary' : 'border-hair-strong')}>{what === v && <span className="size-2 rounded-full bg-primary" />}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

/* First sign-in: welcome dialog, then a three-step tour on the real screen. */
const tourSteps = [
  { target: 'needs', title: 'Start here each morning', body: 'The three jobs that need you before your first visit, most urgent first. Each card has one clear next step.' },
  { target: 'dayplan', title: 'Your day, in route order', body: 'Visits are listed in the order you will drive them, with drive times between homes. Safety notes for the next visit are highlighted.' },
  { target: 'encounters', title: 'Work from the next step', body: 'Every encounter tells you what to do next, from resuming a visit to answering a coder. Open a row to pick up where you left off.' },
]

function Tour() {
  const { tourStep, setTourStep } = useStore()
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = tourSteps[tourStep]
  useLayoutEffect(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const update = () => setRect(el.getBoundingClientRect())
    update()
    const t = setTimeout(update, 350)
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', update)
    }
  }, [tourStep, step])
  useEffect(() => {
    if (!step) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setTourStep(-1)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [step, setTourStep])
  if (!step || !rect) return null
  const pad = 8
  const popW = 360
  const below = rect.top < window.innerHeight / 2
  let left = rect.left
  if (step.target === 'dayplan') left = rect.left - popW - 16
  if (step.target === 'encounters') left = rect.right - popW / 2
  left = Math.max(16, Math.min(left, window.innerWidth - popW - 16))
  const top = step.target === 'needs' ? rect.bottom + 16 : step.target === 'dayplan' ? rect.top + 60 : rect.top + 80
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Product tour">
      <motion.div
        className="absolute rounded-[14px] ring-2 ring-primary"
        animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        transition={{ duration: 0.4, ease }}
        style={{ boxShadow: '0 0 0 9999px rgba(5,5,5,0.45)' }}
      />
      <motion.div
        key={tourStep}
        initial={{ opacity: 0, y: below ? -6 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease }}
        style={{ left, top: Math.min(top, window.innerHeight - 240), width: popW }}
        className="absolute rounded-xl border border-hair bg-canvas p-6 shadow-pop"
      >
        <div className="flex items-center justify-between">
          <span className="text-label text-primary-ink">Step {tourStep + 1} of 3</span>
          <button aria-label="Close tour" onClick={() => setTourStep(-1)} className="rounded-xs p-0.5 text-ink-2 hover:bg-select"><X size={16} /></button>
        </div>
        <h3 className="mt-2 text-body font-medium">{step.title}</h3>
        <p className="mt-2 text-sm text-ink-2">{step.body}</p>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex gap-1.5">
            {tourSteps.map((_, i) => <motion.span key={i} animate={{ width: i === tourStep ? 18 : 6 }} className={cx('h-1.5 rounded-full', i === tourStep ? 'bg-primary' : 'bg-hair-strong')} />)}
          </div>
          <span className="flex-1" />
          {tourStep < 2 && <button onClick={() => setTourStep(-1)} className="text-sm text-ink-2 hover:text-ink">Skip tour</button>}
          <Button variant="primary" size="sm" onClick={() => setTourStep(tourStep < 2 ? tourStep + 1 : -1)}>{tourStep < 2 ? 'Next' : 'Finish'}</Button>
        </div>
      </motion.div>
    </div>
  )
}

function Welcome({ open, onSkip, onStart }: { open: boolean; onSkip: () => void; onStart: () => void }) {
  return (
    <Modal open={open} onClose={onSkip} width={560}>
      <div className="pt-4">
        <Logo size={44} />
        <h2 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.74px]">Welcome to Landmark, Michael</h2>
        <p className="mt-3 text-body text-ink-2">Your panel, schedule and encounters are ready. Take a one-minute tour of how a day works here. You can replay it any time from Help.</p>
        <div className="mt-5 overflow-hidden rounded-lg border border-hair">
          {[
            { icon: Clock, t: 'Start with “Needs you now”', s: 'The three jobs that matter before your first visit' },
            { icon: Calendar, t: 'Follow your day plan', s: 'Visits in route order, with drive times and safety notes' },
            { icon: List, t: 'Work from the next step', s: 'Every encounter tells you what to do next' },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-4 border-b border-hair px-5 py-3.5 last:border-0">
              <span className="flex size-9 items-center justify-center rounded-md bg-select"><r.icon size={16} /></span>
              <span><span className="block text-body">{r.t}</span><span className="block text-sm text-ink-3">{r.s}</span></span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 pb-2">
          <span className="text-sm text-ink-3">About 1 minute</span>
          <span className="flex-1" />
          <Button onClick={onSkip}>Skip for now</Button>
          <Button variant="primary" data-autofocus onClick={onStart}>Take the tour</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { firstRun, setFirstRun, setTourStep, open, role } = useStore()
  const [range, setRange] = useState<Range>('today')
  const [filter, setFilter] = useState<Filter>('all')
  const [exp, setExp] = useState(false)
  const welcome = firstRun && role === 'provider'
  const titles: Record<Range, string> = {
    today: 'Monday 16 January 2017 · 6 home visits · 3 things need you before your first visit',
    week: '16 to 20 January 2017 · 24 home visits · 5 encounters still open',
    month: 'January 2017 · 46 visits so far · notes are closing faster',
  }
  return (
    <Page crumbs={[{ label: 'Workspace' }, { label: 'Home' }]}>
      <div className="flex flex-col gap-4">
        <Reveal className="flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-heading">Good morning, Michael</h1>
            <AnimatePresence mode="wait">
              <motion.p key={range} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-0.5 text-sm text-ink-2">{titles[range]}</motion.p>
            </AnimatePresence>
          </div>
          <div className="flex-1" />
          <Segmented id="range" value={range} onChange={setRange} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }]} />
          <Button onClick={() => setExp(true)}>Export</Button>
        </Reveal>

        <Reveal delay={0.05}>
          <div data-tour="needs" className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Clock, primary: true, eyebrow: 'Closes in 4 hrs', title: "Finish John Susliet's encounter", sub: 'Pulse and assessment and plan still needed', cta: 'Resume encounter', run: () => navigate('/encounter/e1?step=7') },
              { icon: FileText, eyebrow: 'Returned by coding', title: '2 encounters need changes', sub: 'Missing CKD stage · diabetes linkage', cta: 'Review notes', run: () => navigate('/coding') },
              { icon: AlertTriangle, eyebrow: 'Next visit · 09:30', title: 'Prepare for Chris Campbell', sub: 'DNR · escort required after hours', cta: 'Open chart', run: () => navigate('/patients/cc') },
            ].map((c, i) => (
              <Card key={i} whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="flex flex-col p-[18px]">
                <div className="flex gap-3.5">
                  <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-lg', c.primary ? 'bg-primary text-primary-on' : 'bg-select text-ink')}><c.icon size={20} strokeWidth={1.6} /></span>
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className={cx('text-label', c.primary ? 'text-primary-ink' : 'text-ink-2')}>{c.eyebrow}</span>
                    <span className="text-sm font-medium">{c.title}</span>
                    <span className="text-cap text-ink-3">{c.sub}</span>
                  </span>
                </div>
                <div className="flex justify-end pt-3.5">
                  <Button size="sm" variant={c.primary ? 'primary' : 'secondary'} onClick={c.run}>{c.cta}</Button>
                </div>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="grid grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="wait" initial={false}>
              {kpis[range].map((k, i) => (
                <motion.button
                  key={range + k.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  disabled={!k.to}
                  onClick={() => k.to && (k.to.startsWith('/') ? navigate(k.to) : setFilter(k.to as Filter))}
                  className={cx('flex flex-col gap-1.5 px-5 py-4 text-left transition-colors enabled:hover:bg-select/50', i > 0 && 'border-l border-hair', i === 2 && 'max-lg:border-l-0 max-lg:border-t', i === 3 && 'max-lg:border-t')}
                >
                  <span className="text-cap text-ink-2">{k.label}</span>
                  <span className="flex w-full items-end gap-2">
                    <span className="font-mono text-fig">{k.value}</span>
                    <span className="flex items-center gap-0.5 pb-[3px] font-mono text-mono text-ink-2">
                      {k.delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(k.delta)}
                    </span>
                    <span className="flex-1" />
                    {k.spark.length ? <span className="hidden sm:block"><Sparkline points={k.spark} /></span> : <span className="hidden sm:block"><WeekBars /></span>}
                  </span>
                  <span className="text-cap text-ink-3">{k.foot}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </Card>
        </Reveal>

        <Reveal delay={0.15} className="flex flex-col gap-4 xl:flex-row">
          <EncountersCard filter={filter} setFilter={setFilter} />
          <DayPlan />
        </Reveal>
      </div>
      <ExportModal open={exp} onClose={() => setExp(false)} />
      <Welcome
        open={welcome}
        onSkip={() => setFirstRun(false)}
        onStart={() => {
          setFirstRun(false)
          setTimeout(() => setTourStep(0), 300)
        }}
      />
      <Tour />
    </Page>
  )
}
