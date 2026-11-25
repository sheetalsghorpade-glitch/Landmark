import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronRight, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Avatar, Button, Card, Dropdown, EmptyState, Reveal, Tooltip, cx, ease } from '../components/ui'
import { careGaps, patientById, type CareGap } from '../data/mock'
import { useStore } from '../store'

const measures = [
  { key: 'carePlan', label: 'Care plan' },
  { key: 'bp', label: 'Blood pressure' },
  { key: 'retinopathy', label: 'Retinopathy' },
  { key: 'digoxin', label: 'Digoxin' },
  { key: 'diuretic', label: 'Diuretic' },
] as const

function Heat({ n }: { n: number }) {
  const cls = n === 0 ? 'border border-hair-strong text-ink-3' : n <= 2 ? 'bg-green-wash text-rag-green' : n <= 4 ? 'bg-red-wash text-rag-red' : 'bg-rag-red text-white'
  return <span className={cx('inline-flex h-9 w-[62px] items-center justify-center rounded-xs font-mono text-mono', cls)}>{n}</span>
}

function PriorityTag({ p }: { p: CareGap['priority'] }) {
  const bars = p === 'High' ? 3 : p === 'Moderate' ? 2 : 1
  const color = p === 'High' ? 'text-rag-red' : p === 'Moderate' ? 'text-rag-amber' : 'text-rag-green'
  return (
    <span className={cx('flex items-center gap-2 text-body', color)}>
      <span className="flex items-end gap-[2px]">
        {[8, 11, 14].map((h, i) => <span key={i} style={{ height: h }} className={cx('w-[3px] rounded-[1px]', i < bars ? 'bg-current' : 'bg-hair-strong')} />)}
      </span>
      {p}
    </span>
  )
}

type SortKey = 'name' | 'priority' | (typeof measures)[number]['key'] | 'open'

export default function CareGaps() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { open, toast } = useStore()
  const [q, setQ] = useState('')
  const [acuity, setAcuity] = useState<'all' | 'A' | 'B' | 'C'>((params.get('acuity') as 'B') ?? 'B')
  const [days, setDays] = useState<'30' | '60' | 'all'>('30')
  const [prio, setPrio] = useState<'all' | CareGap['priority']>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'open', dir: -1 })

  const total = (g: CareGap) => g.carePlan + g.bp + g.retinopathy + g.digoxin + g.diuretic
  const rows = useMemo(() => {
    const pr = { High: 3, Moderate: 2, Low: 1 }
    let r = careGaps.filter(
      (g) =>
        (acuity === 'all' || g.acuity === acuity) &&
        (days === 'all' || g.lastVisitDays <= Number(days)) &&
        (prio === 'all' || g.priority === prio) &&
        patientById(g.patientId).name.toLowerCase().includes(q.toLowerCase()),
    )
    r = [...r].sort((a, b) => {
      const v = (g: CareGap) => (sort.key === 'name' ? patientById(g.patientId).name : sort.key === 'priority' ? pr[g.priority] : sort.key === 'open' ? total(g) : g[sort.key])
      const [x, y] = [v(a), v(b)]
      return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * sort.dir
    })
    return r
  }, [acuity, days, prio, q, sort])

  const sum = rows.reduce((a, g) => a + total(g), 0)
  const head = (key: SortKey, label: string, className = '') => (
    <button
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}
      className={cx('group inline-flex items-center gap-1 font-medium transition-colors hover:text-ink', sort.key === key ? 'text-ink' : 'text-ink-2', className)}
    >
      {label}
      <span className={cx('transition-opacity', sort.key === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-50')}>
        {sort.dir === -1 && sort.key === key ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
      </span>
    </button>
  )
  const exportCsv = () => {
    const csv = [['Patient', 'MRN', 'Priority', ...measures.map((m) => m.label), 'Last review'], ...rows.map((g) => [patientById(g.patientId).name, patientById(g.patientId).mrn, g.priority, ...measures.map((m) => String(g[m.key])), g.lastReview])]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'landmark-care-gaps.csv'
    a.click()
    toast(`Exported ${rows.length} patients`)
  }

  return (
    <Page crumbs={[{ label: 'Patients' }, { label: 'Care gaps' }]}>
      <Reveal className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-heading">Care gaps</h1>
          <p className="mt-0.5 text-sm text-ink-2">{acuity === 'all' ? 'All acuities' : `Acuity ${acuity} panel`} · {days === 'all' ? 'any visit date' : `most recent visit in the last ${days} days`}</p>
        </div>
        <div className="flex-1" />
        <Button onClick={exportCsv}>Export</Button>
        <Button variant="primary" onClick={() => open('newTask', { title: 'Close open care measures' })}>Create task</Button>
      </Reveal>

      <Reveal delay={0.05} className="mb-4 grid gap-4 md:grid-cols-3">
        {[
          { l: 'Patients in view', v: String(rows.length), s: `${rows.length} shown below`, spark: null },
          { l: 'Open measures', v: String(sum), s: 'across 5 measures', spark: 'M0 6 L30 14 L60 18 L90 26 L120 34' },
          { l: 'Closed in 30 days', v: '12', s: 'up from 7 last month', spark: 'M0 36 L40 24 L70 28 L120 8' },
        ].map((k) => (
          <Card key={k.l} className="flex items-end justify-between p-6">
            <div>
              <div className="text-sm text-ink-2">{k.l}</div>
              <motion.div key={k.v} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[32px] font-medium leading-none tracking-[-0.6px]">{k.v}</motion.div>
              <div className="mt-3 text-sm text-ink-3">{k.s}</div>
            </div>
            {k.spark && (
              <svg width={120} height={40} className="mb-8 overflow-visible"><motion.path d={k.spark} fill="none" stroke="rgb(var(--ink))" strokeWidth={1.4} initial={{ pathLength: 0 } as never} animate={{ pathLength: 1 } as never} transition={{ duration: 0.9, ease }} /></svg>
            )}
          </Card>
        ))}
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-hair p-5">
            <div className="relative w-full sm:w-[330px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients" className="h-[36px] w-full rounded-md bg-select pl-9 pr-3 text-body outline-none placeholder:text-ink-3 focus:ring-1 focus:ring-ink" />
            </div>
            <Dropdown label="Acuity" value={acuity} onChange={setAcuity} options={[{ value: 'all', label: 'All' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }]} />
            <Dropdown label="Last visit" value={days} onChange={setDays} options={[{ value: '30', label: '30 days' }, { value: '60', label: '60 days' }, { value: 'all', label: 'Any time' }]} />
            <Dropdown label="Priority" value={prio} onChange={setPrio} options={[{ value: 'all', label: 'All' }, { value: 'High', label: 'High' }, { value: 'Moderate', label: 'Moderate' }, { value: 'Low', label: 'Low' }]} />
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-sm text-ink-2">
              Open measures
              <span className="size-3.5 rounded-[3px] border border-hair-strong" /> 0
              <span className="size-3.5 rounded-[3px] border border-rag-green bg-green-wash" /> 1–2
              <span className="size-3.5 rounded-[3px] border border-rag-red/40 bg-red-wash" /> 3–4
              <span className="size-3.5 rounded-[3px] bg-rag-red" /> 5+
            </div>
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-hair text-body">
                  <th className="px-7 py-3">{head('name', 'Patient')}</th>
                  <th className="px-3 py-3">{head('priority', 'Priority')}</th>
                  {measures.map((m) => <th key={m.key} className="px-3 py-3 text-center">{head(m.key, m.label, 'justify-center')}</th>)}
                  <th className="px-3 py-3 font-medium text-ink-2">Last review</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((g, i) => {
                    const p = patientById(g.patientId)
                    return (
                      <motion.tr
                        layout
                        key={g.patientId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.02 } }}
                        exit={{ opacity: 0 }}
                        onClick={() => navigate(`/patients/${p.id}`)}
                        className="group cursor-pointer border-b border-hair transition-colors last:border-0 hover:bg-select/50"
                      >
                        <td className="px-7 py-3">
                          <span className="flex items-center gap-3">
                            <Avatar initials={p.initials} />
                            <span><span className="block text-body font-medium">{p.name}</span><span className="block font-mono text-mono text-ink-2">{p.mrn}</span></span>
                          </span>
                        </td>
                        <td className="px-3 py-3"><PriorityTag p={g.priority} /></td>
                        {measures.map((m) => (
                          <td key={m.key} className="px-3 py-3 text-center">
                            <Tooltip label={g[m.key] ? `${g[m.key]} open · ${m.label}` : `No open ${m.label.toLowerCase()} measures`}>
                              <Heat n={g[m.key]} />
                            </Tooltip>
                          </td>
                        ))}
                        <td className="px-3 py-3 font-mono text-mono text-ink-2">{g.lastReview}</td>
                        <td className="pr-5"><ChevronRight size={16} className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" /></td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {rows.length === 0 && (
              <EmptyState icon={<Users size={18} />} title="No patients match these filters" body="Try a wider visit window or clear the search." action={<Button size="sm" onClick={() => { setQ(''); setPrio('all'); setDays('all'); setAcuity('all') }}>Clear filters</Button>} />
            )}
          </div>
        </Card>
      </Reveal>
    </Page>
  )
}
