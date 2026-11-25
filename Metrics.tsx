import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Card, CardHeader, Reveal, Segmented, cx, ease } from '../components/ui'
import { useStore, type Brand } from '../store'

const weeks = [
  ['21 Nov', 64], ['28 Nov', 70], ['5 Dec', 68], ['12 Dec', 75], ['19 Dec', 73], ['26 Dec', 79], ['2 Jan', 80], ['9 Jan', 82],
] as const

function BarChart() {
  const [hover, setHover] = useState<number | null>(null)
  const min = 60
  const max = 90
  const H = 220
  const y = (v: number) => H - ((v - min) / (max - min)) * H
  return (
    <div className="relative mt-6">
      <div className="relative ml-12" style={{ height: H }}>
        {[90, 80, 70, 60].map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center" style={{ top: y(t) }}>
            <span className="-ml-12 w-10 text-right font-mono text-mono text-ink-2">{t}%</span>
            <span className={cx('ml-2 flex-1', t === 80 ? 'border-t border-dashed border-ink-2' : 'border-t border-hair')} />
          </div>
        ))}
        <div className="absolute inset-0 ml-2 flex items-end justify-around">
          {weeks.map(([w, v], i) => {
            const last = i === weeks.length - 1
            return (
              <div key={w} className="relative flex h-full w-[12%] max-w-[56px] items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: H - y(v) }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease }}
                  className={cx('w-full rounded-t-[3px] transition-colors', last ? 'bg-ink' : hover === i ? 'bg-ink-faint' : 'bg-hair-strong')}
                />
                <span className="absolute left-1/2 -translate-x-1/2 font-mono text-mono" style={{ bottom: H - y(v) + 6 }}>{v}%</span>
                <AnimatePresence>
                  {hover === i && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-3 py-2 text-cap text-white shadow-pop" style={{ bottom: H - y(v) + 30 }}>
                      Week of {w}: <span className="font-medium">{v}%</span> closed within 24 h
                      <div className="text-white/60">{Math.round((v / 100) * 12)} of 12 notes</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
      <div className="ml-14 mt-2 flex justify-around">
        {weeks.map(([w], i) => <span key={w} className={cx('w-[12%] max-w-[56px] text-center text-sm', i === weeks.length - 1 ? 'text-ink' : 'text-ink-2')}>{w}</span>)}
      </div>
    </div>
  )
}

export function Metrics() {
  const navigate = useNavigate()
  const [range, setRange] = useState<'30' | '90'>('30')
  const k = range === '30'
    ? [['Visits completed', '46', '4 more than last month'], ['Notes closed within 24 h', '82%', 'Up from 64% in December'], ['Returned by coding', '6%', '3 of 46 notes'], ['Care gaps closed', '31', '9 still open on your panel']]
    : [['Visits completed', '131', '12 more than last quarter'], ['Notes closed within 24 h', '74%', 'Up from 61%'], ['Returned by coding', '8%', '10 of 131 notes'], ['Care gaps closed', '78', '9 still open on your panel']]
  return (
    <Page crumbs={[{ label: 'Workspace' }, { label: 'Metrics' }]}>
      <Reveal className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-heading">Metrics</h1>
          <p className="mt-0.5 text-sm text-ink-2">Your panel · last {range} days</p>
        </div>
        <div className="flex-1" />
        <Segmented id="mrange" value={range} onChange={setRange} options={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />
      </Reveal>
      <Reveal delay={0.04} className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {k.map(([l, v, s]) => (
          <Card key={l} className="p-6">
            <div className="text-sm text-ink-2">{l}</div>
            <AnimatePresence mode="wait"><motion.div key={v} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[32px] font-medium leading-none tracking-[-0.6px]">{v}</motion.div></AnimatePresence>
            <div className="mt-3 text-sm text-ink-3">{s}</div>
          </Card>
        ))}
      </Reveal>
      <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_440px]">
        <Reveal delay={0.08}>
          <Card className="p-6">
            <CardHeader title="Notes closed within 24 hours, by week" right={<span className="text-sm text-ink-2">Target 80%</span>} />
            <p className="mt-2 text-body text-ink-2">Up from 64% to 82% in eight weeks, since diagnoses were linked to note sections.</p>
            <BarChart />
          </Card>
        </Reveal>
        <Reveal delay={0.12}>
          <Card className="h-full p-6">
            <CardHeader title="Why notes were returned" count={3} />
            {[['Diagnosis not linked to a section', 2], ['Vitals incomplete', 1]].map(([l, n]) => (
              <div key={l as string} className="border-t border-hair py-4">
                <div className="flex justify-between text-body"><span>{l}</span><span className="font-mono">{n}</span></div>
                <div className="mt-3 h-1.5 rounded-full bg-select"><motion.div initial={{ width: 0 }} animate={{ width: `${((n as number) / 3) * 100}%` }} transition={{ duration: 0.7, ease }} className="h-full rounded-full bg-ink" /></div>
              </div>
            ))}
            <p className="mt-2 text-sm text-ink-2">Linking each diagnosis to an exam section stopped most returns since January.</p>
            <button onClick={() => navigate('/coding')} className="mt-4 text-body font-medium text-primary-ink hover:underline">Open coding review</button>
          </Card>
        </Reveal>
      </div>
      <Reveal delay={0.16} className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-body font-medium">Documentation time</h3>
          {[['Median time per note', '14 min', 'Down from 22 min in November'], ['Charting after hours', '36 min a day', 'Benchmark 1.4 h for primary care'], ['Notes signed same day', '71%', 'Up from 52%']].map(([l, v, s]) => (
            <div key={l} className="flex justify-between gap-4 border-t border-hair py-3.5 first:mt-3">
              <div><div className="text-body text-ink-2">{l}</div><div className="text-sm text-ink-3">{s}</div></div>
              <div className="whitespace-nowrap text-body font-medium">{v}</div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <CardHeader title="Care gaps by measure" right={<span className="text-sm text-ink-2">closed / total</span>} />
          {[['Blood pressure', 8, 20], ['Care plan', 6, 15], ['Digoxin level', 5, 12], ['Retinopathy', 7, 11], ['Diuretic review', 5, 8]].map(([l, a, b]) => (
            <div key={l as string} className="mt-4">
              <div className="flex justify-between text-body"><span>{l}</span><span className="font-mono text-mono text-ink-2">{a} / {b}</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-select"><motion.div initial={{ width: 0 }} animate={{ width: `${((a as number) / (b as number)) * 100}%` }} transition={{ duration: 0.7, ease }} className="h-full rounded-full bg-primary" /></div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <CardHeader title="Visits by type" right={<span className="text-sm text-ink-2">46 this month</span>} />
          {[['Maintenance', 22], ['Annual', 12], ['Follow-up', 8], ['Urgent', 4]].map(([l, n]) => (
            <div key={l as string} className="mt-5 flex items-center gap-4">
              <span className="w-28 text-body">{l}</span>
              <div className="h-2 flex-1"><motion.div initial={{ width: 0 }} animate={{ width: `${((n as number) / 22) * 100}%` }} transition={{ duration: 0.7, ease }} className={cx('h-full rounded-full', l === 'Urgent' ? 'bg-ink' : 'bg-hair-strong')} /></div>
              <span className="w-6 text-right font-mono text-mono">{n}</span>
            </div>
          ))}
          <p className="mt-5 text-sm text-ink-2">Urgent visits kept 4 patients out of the emergency department.</p>
        </Card>
      </Reveal>
    </Page>
  )
}

export function Settings() {
  const { brand, setBrand, toast } = useStore()
  const [prefs, setPrefs] = useState({ assist: true, listening: true, digest: true, sms: false })
  const [saved, setSaved] = useState(false)
  const Toggle = ({ k, label, sub }: { k: keyof typeof prefs; label: string; sub: string }) => (
    <div className="flex items-start justify-between gap-6 border-t border-hair py-4">
      <div><div className="text-body">{label}</div><div className="text-sm text-ink-3">{sub}</div></div>
      <button role="switch" aria-checked={prefs[k]} onClick={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))} className={cx('relative h-6 w-10 shrink-0 rounded-full transition-colors', prefs[k] ? 'bg-primary' : 'bg-hair-strong')}>
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 35 }} className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow', prefs[k] ? 'right-0.5' : 'left-0.5')} />
      </button>
    </div>
  )
  return (
    <Page crumbs={[{ label: 'Workspace' }, { label: 'Settings' }]}>
      <Reveal className="mb-6"><h1 className="text-heading">Settings</h1><p className="mt-0.5 text-sm text-ink-2">Your profile, notifications and Landmark Assist.</p></Reveal>
      <div className="grid max-w-[1100px] gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-body font-medium">Landmark Assist</h2>
          <Toggle k="assist" label="Visit briefs" sub="A short summary of what changed before each visit" />
          <Toggle k="listening" label="Offer listening during visits" sub="Always asks the patient for consent first" />
        </Card>
        <Card className="p-6">
          <h2 className="text-body font-medium">Notifications</h2>
          <Toggle k="digest" label="Morning digest" sub="At 07:30, the jobs that need you before your first visit" />
          <Toggle k="sms" label="Text me when a note is returned" sub="To the phone ending 4821" />
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-body font-medium">Brand variation</h2>
          <p className="mt-1 text-sm text-ink-3">The prototype runs on one set of design tokens. Switch the brand to see all three variations.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {([['green', '#0f6b34', 'Green, original'], ['yellow', '#FFCF33', 'Yellow'], ['blue', '#0B6FB8', 'Blue, cross logo']] as [Brand, string, string][]).map(([v, c, l]) => (
              <button key={v} onClick={() => setBrand(v)} className={cx('flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors', brand === v ? 'border-ink font-medium' : 'border-hair hover:border-hair-strong')}>
                <span className="size-5 rounded-full" style={{ background: c }} /> {l}
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-6 flex max-w-[1100px] justify-end">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setSaved(true); toast('Settings saved') }} className="rounded-md bg-primary px-[18px] py-[9px] text-sm font-medium text-primary-on hover:bg-primary-press">
          {saved ? 'Saved' : 'Save changes'}
        </motion.button>
      </div>
    </Page>
  )
}
