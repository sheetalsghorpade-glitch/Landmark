import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Button, Card, Reveal, Segmented, cx, ease } from '../components/ui'
import { careGaps, patientById, visits, type Visit } from '../data/mock'

const days = [['Mon', 16], ['Tue', 17], ['Wed', 18], ['Thu', 19], ['Fri', 20]] as const
const START = 8
const HOURS = 9
const ROW = 64
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const NOW = toMin('09:05')

export default function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const view = (params.get('view') as 'day' | 'week') || 'week'
  const [day, setDay] = useState(0)
  const [sel, setSel] = useState<Visit>(visits[1])
  useEffect(() => {
    if (view === 'day') setSel(visits.find((v) => v.day === day) ?? visits[0])
  }, [day, view])
  const shownDays = view === 'week' ? days.map((_, i) => i) : [day]
  const p = patientById(sel.patientId)
  const gaps = careGaps.find((g) => g.patientId === sel.patientId)
  const gapCount = gaps ? gaps.carePlan + gaps.bp + gaps.retinopathy + gaps.digoxin + gaps.diuretic : 0
  const dayVisits = visits.filter((v) => v.day === day).sort((a, b) => toMin(a.start) - toMin(b.start))

  return (
    <Page crumbs={[{ label: 'Workspace' }, { label: 'Calendar' }]}>
      <Reveal className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-heading">Calendar</h1>
          <p className="mt-0.5 text-sm text-ink-2">{view === 'week' ? '16 to 20 January 2017 · 16 home visits · 212 mi' : `${days[day][0]} ${days[day][1]} January 2017 · ${dayVisits.length} home visits`}</p>
        </div>
        <div className="flex-1" />
        {view === 'day' && (
          <div className="flex gap-1">
            <button aria-label="Previous day" disabled={day === 0} onClick={() => setDay((d) => d - 1)} className="rounded-xs border border-hair-strong p-2 hover:bg-select disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button aria-label="Next day" disabled={day === 4} onClick={() => setDay((d) => d + 1)} className="rounded-xs border border-hair-strong p-2 hover:bg-select disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        )}
        <Segmented id="calview" value={view} onChange={(v) => setParams({ view: v }, { replace: true })} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} />
      </Reveal>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid border-b border-hair" style={{ gridTemplateColumns: `72px repeat(${shownDays.length}, 1fr)` }}>
                <span />
                {shownDays.map((d) => (
                  <button key={d} onClick={() => { setDay(d); setParams({ view: 'day' }, { replace: true }) }} className="px-4 py-3 text-left hover:bg-select/50">
                    <div className={cx('flex items-center gap-1.5 text-sm', d === 0 ? 'text-primary-ink' : 'text-ink-2')}>{days[d][0]}{d === 0 && <><span className="size-1.5 rounded-full bg-primary" /> Today</>}</div>
                    <div className={cx('text-[24px] font-medium leading-tight', d === 0 && 'text-primary-ink')}>{days[d][1]}</div>
                  </button>
                ))}
              </div>
              <div className="relative grid" style={{ gridTemplateColumns: `72px repeat(${shownDays.length}, 1fr)`, height: HOURS * ROW }}>
                <div className="relative">
                  {Array.from({ length: HOURS }).map((_, h) => (
                    <span key={h} className="absolute left-4 font-mono text-mono text-ink-2" style={{ top: h * ROW - 9 + (h === 0 ? 12 : 0) }}>{String(START + h).padStart(2, '0')}:00</span>
                  ))}
                </div>
                {shownDays.map((d) => (
                  <div key={d} className={cx('relative border-l border-hair', d === 0 && 'bg-wash')}>
                    {Array.from({ length: HOURS }).map((_, h) => <div key={h} className="border-b border-hair" style={{ height: ROW }} />)}
                    {d === 0 && (
                      <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: ((NOW - START * 60) / 60) * ROW }}>
                        <span className="-ml-1 size-2 rounded-full bg-primary" />
                        <span className="h-[1.5px] flex-1 bg-primary" />
                      </div>
                    )}
                    {visits.filter((v) => v.day === d).map((v, i) => {
                      const top = ((toMin(v.start) - START * 60) / 60) * ROW
                      const h = (v.minutes / 60) * ROW - 6
                      const on = sel.id === v.id
                      const vp = patientById(v.patientId)
                      return (
                        <motion.button
                          key={v.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.03 * i + d * 0.04, ease }}
                          whileHover={{ scale: 1.015 }}
                          onClick={() => setSel(v)}
                          style={{ top: top + 3, height: h }}
                          className={cx(
                            'absolute inset-x-2 overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors',
                            on ? 'z-10 border-2 border-primary bg-canvas' : v.done ? 'border-hair bg-select text-ink-3' : 'border-hair bg-canvas hover:border-hair-strong',
                          )}
                        >
                          <div className="flex items-center justify-between font-mono text-mono text-ink-2">
                            <span className={on ? 'text-primary-ink' : ''}>{v.start}</span>
                            {v.done ? <Check size={14} /> : v.flag ? <AlertTriangle size={14} className="text-ink" /> : null}
                          </div>
                          <div className={cx('truncate text-body', v.done ? 'text-ink-3' : 'text-ink')}>{vp.name}</div>
                          {h > 56 && <div className="truncate text-cap text-ink-3">{v.type} · {v.town}</div>}
                        </motion.button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div key={sel.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease }}>
              <Card className="border-primary p-6">
                <div className="text-sm text-primary-ink">{sel.id === 'v2' ? 'Next visit · in 25 min' : sel.done ? 'Done' : `${days[sel.day][0]} ${days[sel.day][1]} · ${sel.start}`}</div>
                <h2 className="mt-2 text-[26px] font-medium tracking-[-0.5px]">{p.name}</h2>
                <p className="text-body text-ink-2">{sel.type} visit · {sel.start} to {String(Math.floor((toMin(sel.start) + sel.minutes) / 60)).padStart(2, '0')}:{String((toMin(sel.start) + sel.minutes) % 60).padStart(2, '0')}</p>
                <dl className="mt-4">
                  {[['Address', p.address], ['Drive', sel.id === 'v2' ? '22 min from Rossalyn Warren' : '18 min from the previous visit'], ['Open gaps', gapCount ? `${gapCount} measures${gaps && gaps.bp ? ', blood pressure and care plan' : ''}` : 'None']].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[110px_1fr] border-t border-hair py-3">
                      <dt className="text-sm text-ink-2">{k}</dt>
                      <dd className="text-body">{v}</dd>
                    </div>
                  ))}
                </dl>
                {sel.flag && <div className="mt-2 flex items-center gap-2 rounded-md bg-select px-4 py-3 text-body"><AlertTriangle size={16} /> {sel.flag}</div>}
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => navigate(`/patients/${p.id}`)}>Open chart</Button>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(p.address)}`} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-hair-strong bg-canvas px-[18px] py-[9px] text-sm font-medium transition-colors hover:border-ink-faint hover:bg-select/60"><MapPin size={15} /> Directions</a>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
          {view === 'week' ? (
            <Card className="p-6">
              <h3 className="text-sub text-[18px]">This week</h3>
              {[['Visits', '16'], ['Driving', '212 mi · about 6 h'], ['Safety notes', '3 visits'], ['Annual visits', '4, care gaps due']].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-hair py-3 last:border-0">
                  <span className="text-body text-ink-2">{k}</span>
                  <span className="font-mono text-[14px]">{v}</span>
                </div>
              ))}
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-sub text-[18px]">Route</h3>
              <ol className="mt-3">
                {dayVisits.map((v, i) => (
                  <li key={v.id}>
                    <button onClick={() => setSel(v)} className={cx('flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-select/60', sel.id === v.id && 'bg-wash')}>
                      <span className="flex size-6 items-center justify-center rounded-full bg-select font-mono text-[11px]">{i + 1}</span>
                      <span className="w-12 font-mono text-mono text-ink-2">{v.start}</span>
                      <span className="flex-1 text-body">{patientById(v.patientId).name}</span>
                      <span className="text-cap text-ink-3">{v.town}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    </Page>
  )
}
