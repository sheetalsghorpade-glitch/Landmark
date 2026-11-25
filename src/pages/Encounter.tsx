import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, Clock, Copy, Mic, Pause, Play, ShieldAlert, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Avatar, Button, Card, Modal, Tooltip, cx, ease } from '../components/ui'
import { encounterSections, patientById, phqQuestions } from '../data/mock'
import { nowTime, useStore } from '../store'

/* ---------- encounter state, kept per encounter for the session ---------- */
interface Vitals {
  weight: string; height: string; bp: string; pulse: string; resp: string; spo2: string; temp: string; hba1c: string; pain: string
}
interface EncState {
  vitals: Vitals
  phq: (number | null)[]
  notes: Record<number, string>
  notAssessed: Record<number, boolean>
  complete: boolean[]
  savedAt: string
}
const memory = new Map<string, EncState>()

const prefilledNotes: Record<number, string> = {
  1: 'Maintenance visit at home. Patient seen with wife present.',
  2: 'Short of breath climbing stairs for about a week. No chest pain. Sleeps on two pillows, same as before.',
  3: 'Type 2 diabetes, CKD stage 3, hypertension, osteoarthritis.',
  4: 'Lives with wife. Former smoker, quit 2001. No alcohol.',
  5: 'Right knee replacement 2009. Cataract surgery 2014.',
  6: 'Positive for dyspnoea on exertion. Negative for chest pain, palpitations, syncope.',
  8: 'Alert and oriented. Mild bibasal crackles. Trace ankle oedema.',
  10: 'Eats two meals a day. Weight stable.',
}

function initState(done: number): EncState {
  const complete = encounterSections.map((_, i) => i < done && i !== 6 && i !== 8 && i !== 10)
  return {
    vitals: { weight: '140', height: '68.1', bp: '132 / 82', pulse: '', resp: '16', spo2: '97', temp: '98.6', hba1c: '9.0', pain: '4' },
    phq: [1, 1, 2, 1, 0, 2, 1, 1, 0],
    notes: { ...prefilledNotes },
    notAssessed: {},
    complete,
    savedAt: '09:42',
  }
}

/* ---------- vitals validation ---------- */
type Check = { level: 'error' | 'warn'; msg: string } | null
const num = (v: string) => (v.trim() === '' ? NaN : Number(v))
const range = (label: string, v: string, hard: [number, number], soft?: [number, number], unit = ''): Check => {
  if (v.trim() === '') return null
  const n = num(v)
  if (Number.isNaN(n)) return { level: 'error', msg: 'Enter a number' }
  if (n < hard[0] || n > hard[1]) return { level: 'error', msg: `${label} ${n}${unit} is outside ${hard[0]} to ${hard[1]}. Check the value.` }
  if (soft && (n < soft[0] || n > soft[1])) return { level: 'warn', msg: `Unusual for ${label.toLowerCase()}. Usually ${soft[0]} to ${soft[1]}.` }
  return null
}
function checkVitals(v: Vitals): Record<keyof Vitals, Check> {
  const bpMatch = v.bp.replace(/\s/g, '').match(/^(\d{2,3})\/(\d{2,3})$/)
  let bp: Check = null
  if (v.bp.trim() && !bpMatch) bp = { level: 'error', msg: 'Use the format 120 / 80' }
  else if (bpMatch) {
    const [s, d] = [Number(bpMatch[1]), Number(bpMatch[2])]
    if (s < 60 || s > 260 || d < 30 || d > 160 || d >= s) bp = { level: 'error', msg: 'That reading is not possible. Check systolic and diastolic.' }
    else if (s >= 140 || d >= 90) bp = { level: 'warn', msg: 'Above target. It will be flagged in the plan.' }
  }
  return {
    weight: range('Weight', v.weight, [50, 700], [90, 350], ' lb'),
    height: range('Height', v.height, [36, 96], [54, 80], ' in'),
    bp,
    pulse: range('Pulse', v.pulse, [25, 250], [50, 110], ' bpm'),
    resp: range('Respiration', v.resp, [4, 60], [10, 24], '/min'),
    spo2: range('Oxygen saturation', v.spo2, [50, 100], [92, 100], '%'),
    temp: range('Temperature', v.temp, [86, 110], [96, 100.4], '°F'),
    hba1c: range('HbA1c', v.hba1c, [3, 20], [4, 9.5], '%'),
    pain: range('Pain score', v.pain, [0, 10]),
  }
}

const phqBand = (s: number) =>
  s <= 4 ? 'None to minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : s <= 19 ? 'Moderately severe' : 'Severe'

/* ---------- small pieces ---------- */
function VField({ label, unit, value, onChange, sub, check, required, highlight }: {
  label: string; unit?: string; value: string; onChange: (v: string) => void; sub?: string; check?: Check; required?: boolean; highlight?: boolean
}) {
  const missing = required && !value.trim()
  return (
    <div>
      <label className="mb-2 block text-sm text-ink-2">{label}{required && <span className="text-ink"> *</span>}</label>
      <motion.div
        animate={highlight ? { boxShadow: ['0 0 0 0 rgba(0,0,0,0)', '0 0 0 4px var(--primary-wash)', '0 0 0 0 rgba(0,0,0,0)'] } : {}}
        transition={{ duration: 1.2 }}
        className={cx(
          'flex h-[44px] overflow-hidden rounded-md border bg-canvas transition-colors focus-within:border-ink',
          check?.level === 'error' ? 'border-rag-red' : check?.level === 'warn' ? 'border-rag-amber' : missing ? 'border-ink' : 'border-hair-strong hover:border-ink-faint',
        )}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={required ? 'Enter' : ''}
          inputMode="decimal"
          aria-label={label}
          aria-invalid={check?.level === 'error'}
          className="min-w-0 flex-1 bg-transparent px-4 text-body outline-none placeholder:text-ink-3"
        />
        {unit && <span className="flex items-center border-l border-hair bg-select/70 px-3 font-mono text-mono text-ink-3">{unit}</span>}
      </motion.div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={(check?.msg ?? '') + (missing ? 'm' : '') + sub}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cx('mt-2 text-sm', check?.level === 'error' ? 'text-rag-red' : check?.level === 'warn' ? 'text-rag-amber' : missing ? 'text-ink' : 'text-ink-3')}
        >
          {check?.msg ?? (missing ? 'Required to save' : sub ?? ' ')}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function VitalsStep({ v, set, flash }: { v: Vitals; set: (k: keyof Vitals, val: string) => void; flash: string[] }) {
  const checks = checkVitals(v)
  const kg = Number.isNaN(num(v.weight)) ? '' : `${(num(v.weight) * 0.4536).toFixed(1)} kg`
  const cm = Number.isNaN(num(v.height)) ? '' : `${Math.round(num(v.height) * 2.54)} cm`
  const bmi = !Number.isNaN(num(v.weight)) && !Number.isNaN(num(v.height)) && num(v.height) > 0 ? ((num(v.weight) / (num(v.height) * num(v.height))) * 703).toFixed(1) : ''
  const c = !Number.isNaN(num(v.temp)) ? `${(((num(v.temp) - 32) * 5) / 9).toFixed(0)} °C · oral` : ''
  return (
    <div className="flex flex-col gap-7">
      <section>
        <h3 className="mb-4 text-body font-medium">Body measurements</h3>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
          <VField label="Weight" unit="lb" value={v.weight} onChange={(x) => set('weight', x)} sub={kg} check={checks.weight} highlight={flash.includes('weight')} />
          <VField label="Height" unit="in" value={v.height} onChange={(x) => set('height', x)} sub={cm} check={checks.height} />
          <div>
            <label className="mb-2 block text-sm text-ink-2">BMI</label>
            <div className="flex h-[44px] items-center rounded-md border border-hair-strong bg-canvas px-4 text-body">{bmi}</div>
            <p className="mt-2 text-sm text-ink-3">Calculated</p>
          </div>
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-body font-medium">Cardiovascular and respiratory</h3>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
          <VField label="Blood pressure" unit="mmHg" value={v.bp} onChange={(x) => set('bp', x)} sub="Sitting · left arm" check={checks.bp} highlight={flash.includes('bp')} />
          <VField label="Pulse" unit="bpm" required value={v.pulse} onChange={(x) => set('pulse', x)} check={checks.pulse} highlight={flash.includes('pulse')} sub={flash.includes('pulse') ? 'Heard at 09:52' : undefined} />
          <VField label="Respiration" unit="/min" value={v.resp} onChange={(x) => set('resp', x)} check={checks.resp} />
          <VField label="Oxygen saturation" unit="%" value={v.spo2} onChange={(x) => set('spo2', x)} sub="Room air" check={checks.spo2} />
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-body font-medium">Point of care</h3>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
          <VField label="Temperature" unit="°F" value={v.temp} onChange={(x) => set('temp', x)} sub={c} check={checks.temp} />
          <VField label="HbA1c" unit="%" value={v.hba1c} onChange={(x) => set('hba1c', x)} sub="Point-of-care" check={checks.hba1c} />
          <VField label="Pain score" unit="/10" value={v.pain} onChange={(x) => set('pain', x)} check={checks.pain} />
        </div>
      </section>
    </div>
  )
}

function PhqStep({ phq, set }: { phq: (number | null)[]; set: (i: number, v: number) => void }) {
  const q9 = phq[8]
  return (
    <div>
      <p className="text-body text-ink-2">Over the last two weeks, how often has the patient been bothered by the following? 0 not at all, 1 several days, 2 more than half the days, 3 nearly every day.</p>
      <div className="mt-6 grid grid-cols-[1fr_repeat(4,52px)] items-center gap-x-2 text-sm sm:grid-cols-[1fr_repeat(4,72px)]">
        <span className="pb-2 text-ink-2">Question</span>
        {[0, 1, 2, 3].map((n) => <span key={n} className="pb-2 text-center font-mono text-mono text-ink-2">{n}</span>)}
        {phqQuestions.map((q, i) => (
          <div key={q} role="radiogroup" aria-label={q} className="contents">
            <span className="flex gap-3 border-t border-hair py-3 pr-2 text-body">
              <span className="w-3 font-mono text-mono text-ink-3">{i + 1}</span>{q}
            </span>
            {[0, 1, 2, 3].map((n) => {
              const on = phq[i] === n
              return (
                <span key={n} className="flex justify-center border-t border-hair py-2">
                  <motion.button
                    role="radio"
                    aria-checked={on}
                    aria-label={`${n}`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => set(i, n)}
                    className={cx('h-[38px] w-full rounded-md border font-mono text-mono transition-colors', on ? 'border-primary bg-primary text-primary-on' : 'border-hair-strong text-ink-2 hover:border-ink-faint hover:text-ink')}
                  >
                    {n}
                  </motion.button>
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {q9 !== null && q9 > 0 ? (
          <motion.div key="pos" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 flex items-start gap-3 rounded-lg border border-rag-red/30 bg-red-wash p-4">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-rag-red" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rag-red">Question 9 answered “{['', 'Several days', 'More than half the days', 'Nearly every day'][q9]}”.</p>
              <p className="mt-0.5 text-sm text-ink-2">Complete a safety assessment before you leave. The care manager is notified when you sign.</p>
            </div>
            <Button size="sm" variant="danger">Start safety assessment</Button>
          </motion.div>
        ) : (
          <motion.div key="neg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 rounded-md bg-select px-4 py-3 text-sm text-ink-2">
            Question 9 answered “Not at all”. No safety follow-up needed.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GenericStep({ i, text, setText, na, setNa }: { i: number; text: string; setText: (t: string) => void; na: boolean; setNa: (v: boolean) => void }) {
  const chips: Record<number, string[]> = {
    8: ['Continue current plan', 'Refer to dietician', 'Follow up with PCP', 'Repeat labs in 3 months'],
    11: ['Linked to assessment', 'Recapture this year', 'Plan suspect'],
    12: ['POLST reviewed', 'Wishes unchanged', 'Discussed with proxy'],
  }
  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={text}
        disabled={na}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder={`Document ${encounterSections[i].toLowerCase()}`}
        className="field h-auto resize-y py-3 leading-relaxed disabled:bg-select disabled:text-ink-3"
      />
      {chips[i] && !na && (
        <div className="flex flex-wrap gap-2">
          {chips[i].map((c) => (
            <button key={c} onClick={() => setText((text ? text.trimEnd() + ' ' : '') + c + '.')} className="rounded-full border border-hair-strong px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-ink hover:text-ink">
              + {c}
            </button>
          ))}
        </div>
      )}
      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink-2">
        <input type="checkbox" checked={na} onChange={(e) => setNa(e.target.checked)} className="size-4 accent-[rgb(var(--primary))]" />
        Not assessed at this visit
      </label>
      <p className="text-cap text-ink-3">“Not assessed” is recorded explicitly, so a blank never looks complete.</p>
    </div>
  )
}

/* ---------- listening panel (Landmark Assist) ---------- */
const heard = [
  { at: 2, title: 'BP 132/82, sitting', kind: 'Filled in', field: 'bp' },
  { at: 5, title: 'Pulse 76, irregular', kind: 'Suggested', field: 'pulse', value: '76' },
  { at: 8, title: 'Short of breath on stairs for a week', kind: 'Present illness' },
  { at: 11, title: 'Wants to stop morning metformin', kind: 'Plan · needs you' },
]
function ListeningPanel({ onAccept, onEnd, onStop }: { onAccept: (field: string, value: string) => void; onEnd: () => void; onStop: () => void }) {
  const [secs, setSecs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [accepted, setAccepted] = useState<string[]>([])
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [paused])
  const items = heard.filter((h) => secs >= h.at)
  const mm = String(Math.floor((secs + 872) / 60)).padStart(2, '0')
  const ss = String((secs + 872) % 60).padStart(2, '0')
  return (
    <Card initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="p-6">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          {!paused && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-40" />}
          <span className="relative inline-flex size-2.5 rounded-full bg-ink" />
        </span>
        <span className="text-sub text-[18px]">{paused ? 'Paused' : 'Listening'}</span>
        <span className="flex-1" />
        <span className="font-mono text-mono text-ink-2">{mm}:{ss}</span>
      </div>
      <p className="mt-2 text-sm text-ink-3">John agreed to recording at 09:41. Audio is deleted once the note is signed.</p>
      <div className="mt-4 flex items-center gap-1.5 text-sm text-ink-2"><Sparkles size={14} className="text-ink" /> Picked up so far</div>
      <div className="mt-1">
        <AnimatePresence initial={false}>
          {items.length === 0 && <motion.p exit={{ opacity: 0 }} className="py-3 text-sm text-ink-3">Talk to John as usual…</motion.p>}
          {items.map((h) => (
            <motion.div key={h.title} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.35, ease }} className="overflow-hidden border-b border-hair">
              <div className="flex items-start gap-3 py-3">
                <div className="flex-1">
                  <div className="text-body">{h.title}</div>
                  <div className="text-cap text-ink-3">{accepted.includes(h.title) ? 'Filled in' : h.kind}</div>
                </div>
                {h.value && !accepted.includes(h.title) && (
                  <Button size="sm" onClick={() => { onAccept(h.field!, h.value!); setAccepted((a) => [...a, h.title]) }}>Use</Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Button className="mt-4 w-full" onClick={onEnd}>End and review draft</Button>
      <div className="mt-3 flex justify-between">
        <button onClick={() => setPaused((p) => !p)} className="flex items-center gap-1.5 text-sm font-medium text-primary-ink hover:underline">
          {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Resume listening' : 'Pause listening'}
        </button>
        <button onClick={onStop} className="text-sm text-ink-2 hover:text-ink">Stop and discard</button>
      </div>
    </Card>
  )
}

/* ---------- page ---------- */
export default function EncounterPage() {
  const { id = 'e1' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { encounters, updateEncounter, toast, open } = useStore()
  const enc = encounters.find((e) => e.id === id) ?? encounters[0]
  const p = patientById(enc.patientId)
  const step = Math.min(15, Math.max(1, Number(params.get('step')) || Math.min(enc.done + 1, 15)))
  const idx = step - 1
  const [s, setS] = useState<EncState>(() => memory.get(enc.id) ?? initState(enc.done))
  const [listening, setListening] = useState(false)
  const [consent, setConsent] = useState(false)
  const [preview, setPreview] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [flash, setFlash] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const snapshot = useRef<EncState>(s)

  useEffect(() => {
    memory.set(enc.id, s)
  }, [s, enc.id])
  useEffect(() => {
    snapshot.current = s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const autosave = (next: EncState) => {
    setSaving(true)
    setS(next)
    window.clearTimeout((autosave as unknown as { t?: number }).t)
    ;(autosave as unknown as { t?: number }).t = window.setTimeout(() => {
      setSaving(false)
      setS((cur) => ({ ...cur, savedAt: nowTime() }))
    }, 600)
  }

  const checks = checkVitals(s.vitals)
  const vitalsOk = !!s.vitals.pulse.trim() && !Object.values(checks).some((c) => c?.level === 'error')
  const phqScore = s.phq.reduce<number>((a, b) => a + (b ?? 0), 0)
  const phqOk = s.phq.every((x) => x !== null)
  const sectionDone = (i: number) => {
    if (i === 6) return vitalsOk
    if (i === 10) return phqOk && s.complete[10]
    return s.complete[i]
  }
  const doneCount = encounterSections.filter((_, i) => sectionDone(i)).length
  const pct = Math.round((doneCount / 15) * 100)

  useEffect(() => {
    if (enc.done !== doneCount && enc.status === 'open') updateEncounter(enc.id, { done: doneCount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount])

  const stillNeeded = useMemo(() => {
    const out: { t: string; s: string; step: number }[] = []
    if (!s.vitals.pulse.trim()) out.push({ t: 'Pulse', s: idx === 6 ? 'Vitals · this step' : 'Vitals', step: 7 })
    if (!sectionDone(10)) out.push({ t: 'PHQ-9 screening', s: 'Depression screening', step: 11 })
    if (!s.complete[8]) out.push({ t: 'Assessment and plan', s: 'Required to finish', step: 9 })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, idx])

  const go = (n: number) => setParams({ step: String(n) }, { replace: true })
  const markAndNext = () => {
    const complete = [...s.complete]
    if (idx !== 6) {
      const text = s.notes[idx] ?? ''
      if (text.trim() || s.notAssessed[idx] || idx === 10) complete[idx] = true
    }
    autosave({ ...s, complete })
    if (step < 15) go(step + 1)
    else if (stillNeeded.length === 0) navigate(`/encounter/${enc.id}/draft`)
    else toast(`${stillNeeded.length} items still needed before you can finish`)
  }
  const setVital = (k: keyof Vitals, v: string) => autosave({ ...s, vitals: { ...s.vitals, [k]: v } })
  const copyLast = () => {
    autosave({ ...s, vitals: { ...s.vitals, weight: '140', bp: '132 / 82', pulse: '75', resp: '20', temp: '98', hba1c: '9' } })
    setFlash(['weight', 'bp', 'pulse'])
    setTimeout(() => setFlash([]), 1300)
    toast('Copied 6 values from 09 Sep 2016', { label: 'Undo', run: () => setS(snapshot.current) })
  }
  const nextLabel = step < 15 ? `Next: ${encounterSections[step]}` : 'Review and sign'

  const right =
    listening ? (
      <ListeningPanel
        onAccept={(f, v) => {
          if (step !== 7) go(7)
          setVital(f as keyof Vitals, v)
          setFlash([f])
          setTimeout(() => setFlash([]), 1300)
        }}
        onEnd={() => navigate(`/encounter/${enc.id}/draft`)}
        onStop={() => { setListening(false); toast('Listening stopped. Nothing was kept.') }}
      />
    ) : idx === 10 ? (
      <Card className="p-6">
        <h3 className="text-sub text-[18px]">PHQ-9 score</h3>
        <div className="mt-3 flex items-center gap-2">
          <motion.span key={phqScore} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[32px] font-medium leading-none">{phqScore}</motion.span>
          <span className="text-body text-ink-3">/ 27</span>
          <motion.span layout className="ml-1 rounded-xs bg-ink px-2 py-1 text-label text-white">{phqBand(phqScore)}</motion.span>
        </div>
        <div className="mt-4 flex gap-1">
          {[[0, 4], [5, 9], [10, 14], [15, 19], [20, 27]].map(([a, b]) => (
            <div key={a} className={cx('h-1.5 flex-1 rounded-full transition-colors', phqScore >= a && phqScore <= b ? 'bg-ink' : 'bg-select')} />
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-mono text-ink-3">{[0, 5, 10, 15, 20, 27].map((n) => <span key={n}>{n}</span>)}</div>
        <div className="mt-5 border-t border-hair pt-4">
          <div className="text-sm text-ink-2">Last four screenings</div>
          <svg viewBox="0 0 300 70" className="mt-3 w-full">
            {[5, 6, 8, phqScore].map((v, i, arr) => (
              <g key={i}>
                {i > 0 && <line x1={(i - 1) * 96 + 6} y1={62 - arr[i - 1] * 2} x2={i * 96 + 6} y2={62 - v * 2} stroke="rgb(var(--ink))" strokeWidth={1.5} />}
                <circle cx={i * 96 + 6} cy={62 - v * 2} r={4} fill="rgb(var(--ink))" />
              </g>
            ))}
          </svg>
          <div className="flex justify-between text-cap text-ink-3"><span>Sep 15</span><span>Jan 16</span><span>Jun 16</span><span>Today</span></div>
        </div>
      </Card>
    ) : (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sub text-[18px]">Last encounter</h3>
          <span className="font-mono text-mono text-ink-3">09 Sep 2016</span>
        </div>
        {[['Weight', '140 lb'], ['Blood pressure', '132/82'], ['Pulse', '75 bpm'], ['Respiration', '20 /min'], ['Temperature', '98 °F'], ['HbA1c', '9 %']].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-hair py-3 last:border-0">
            <span className="text-body text-ink-2">{k}</span>
            <span className="font-mono text-[14px]">{v}</span>
          </div>
        ))}
      </Card>
    )

  return (
    <Page crumbs={[{ label: 'Encounters', to: '/home' }, { label: `${p.name} · ${enc.type}` }]}>
      <div className="flex flex-col gap-4">
        <Card className="flex flex-wrap items-center gap-4 px-6 py-5">
          <Avatar initials={p.initials} size={40} />
          <div className="min-w-[220px] flex-1">
            <div className="flex items-center gap-3">
              <span className="text-sub text-[18px]">{p.name}</span>
              <span className="flex items-center gap-1.5 text-body"><span className="size-2 rounded-full bg-ink" /> Open</span>
            </div>
            <div className="truncate font-mono text-mono text-ink-2" title={`${enc.type} · Home · 16 Jan 2017 · MRN ${p.mrn} · ${p.age} yrs`}>{enc.type} · 16 Jan 2017 · MRN {p.mrn} · {p.age} yrs</div>
          </div>
          <div className="w-[180px]">
            <div className="flex items-center gap-3 text-sm"><span className="text-ink-2">{doneCount} of 15 sections</span><span className="font-mono text-mono">{pct}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-select">
              <motion.div className="h-full rounded-full bg-primary" animate={{ width: pct + '%' }} transition={{ duration: 0.5, ease }} />
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-xs bg-select px-3 py-1.5 text-sm"><Clock size={14} className="text-ink-2" /> Closes in 4 hrs</span>
          {!listening && <Button onClick={() => setConsent(true)} icon={<Mic size={15} />}>Start listening</Button>}
          <Button onClick={() => setPreview(true)}>Preview note</Button>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr] xl:grid-cols-[240px_1fr_300px] 2xl:grid-cols-[280px_1fr_360px]">
          <Card className="h-fit p-5">
            <div className="mb-3 text-sm text-ink-2">Encounter sections</div>
            <nav aria-label="Encounter sections" className="flex flex-col gap-0.5">
              {encounterSections.map((name, i) => {
                const done = sectionDone(i)
                const cur = i === idx
                const req = (i === 8 || i === 10 || i === 6) && !done
                return (
                  <button
                    key={name}
                    onClick={() => go(i + 1)}
                    aria-current={cur ? 'step' : undefined}
                    className={cx('relative flex items-center gap-3 rounded-md px-2 py-[7px] text-left text-sm transition-colors', cur ? 'text-primary-ink' : done ? 'text-ink-2 hover:bg-select/60' : 'text-ink hover:bg-select/60')}
                  >
                    {cur && <motion.span layoutId="enc-cur" className="absolute inset-0 rounded-md bg-wash" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                    <span className="relative">
                      {done && !cur ? (
                        <span className="flex size-[22px] items-center justify-center rounded-full bg-ink text-white"><Check size={13} strokeWidth={3} /></span>
                      ) : cur ? (
                        <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-primary"><span className="size-2 rounded-full bg-primary" /></span>
                      ) : (
                        <span className="flex size-[22px] items-center justify-center rounded-full border border-hair-strong font-mono text-[11px] text-ink-2">{i + 1}</span>
                      )}
                    </span>
                    <span className="relative flex-1">{name}</span>
                    {req && !cur && (
                      <Tooltip label="Required to finish"><span className="relative size-2 rounded-full bg-ink" /></Tooltip>
                    )}
                  </button>
                )
              })}
            </nav>
          </Card>

          <Card className="flex min-w-0 flex-col">
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8">
              <div>
                <div className="text-sm text-ink-2">Step {step} of 15</div>
                <h1 className="mt-0.5 text-[24px] font-medium tracking-[-0.5px]">{encounterSections[idx]}{idx === 10 && ' (PHQ-9)'}</h1>
              </div>
              {idx === 6 && <Button onClick={copyLast} icon={<Copy size={15} />}>Copy from last visit</Button>}
            </div>
            <motion.div key={idx} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, ease }} className="flex-1 px-6 py-5 sm:px-8">
                {idx === 6 ? (
                  <VitalsStep v={s.vitals} set={setVital} flash={flash} />
                ) : idx === 10 ? (
                  <PhqStep phq={s.phq} set={(i, v) => { const phq = [...s.phq]; phq[i] = v; autosave({ ...s, phq }) }} />
                ) : (
                  <GenericStep
                    i={idx}
                    text={s.notes[idx] ?? ''}
                    setText={(t) => autosave({ ...s, notes: { ...s.notes, [idx]: t } })}
                    na={!!s.notAssessed[idx]}
                    setNa={(v) => autosave({ ...s, notAssessed: { ...s.notAssessed, [idx]: v } })}
                  />
                )}
            </motion.div>
            <div className="flex flex-wrap items-center gap-3 border-t border-hair px-6 py-4 sm:px-8">
              <span className="flex items-center gap-1.5 text-sm text-ink-3">
                {saving ? <><span className="size-3 animate-spin rounded-full border-[1.5px] border-ink-3 border-r-transparent" /> Saving…</> : <><Check size={14} /> Saved automatically · {s.savedAt}</>}
              </span>
              <span className="flex-1" />
              <button onClick={() => setDiscard(true)} className="text-body text-ink-2 hover:text-ink">Discard</button>
              <Button disabled={step === 1} onClick={() => go(step - 1)}>Previous</Button>
              <Button variant="primary" onClick={markAndNext}>{nextLabel}</Button>
            </div>
          </Card>

          <div className="flex flex-col gap-4 lg:col-span-2 xl:col-span-1">
            {right}
            {!listening && (
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sub text-[18px]">Still needed</h3>
                  <span className="font-mono text-mono text-ink-3">{stillNeeded.length}</span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {stillNeeded.map((n) => (
                      <motion.button
                        layout
                        key={n.t}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: 12 }}
                        onClick={() => go(n.step)}
                        className="flex items-start gap-3 rounded-md bg-select px-4 py-3 text-left transition-colors hover:bg-hair/70"
                      >
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-ink" />
                        <span><span className="block text-body font-medium">{n.t}</span><span className="block text-sm text-ink-3">{n.s}</span></span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  {stillNeeded.length === 0 && (
                    <div className="flex items-center gap-2 rounded-md bg-green-wash px-4 py-3 text-sm text-rag-green"><Check size={15} /> Everything required is done</div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={consent}
        onClose={() => setConsent(false)}
        title="Start listening?"
        width={460}
        footer={<><Button onClick={() => setConsent(false)}>Not now</Button><Button variant="primary" onClick={() => { setConsent(false); setListening(true) }}>John agreed, start</Button></>}
      >
        <p className="text-sm text-ink-2">Landmark Assist listens to the visit and suggests what to fill in. Ask John for consent first.</p>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {['Audio is deleted once the note is signed', 'It fills a field only when it is sure; otherwise it suggests', 'Nothing reaches the chart until you sign'].map((t) => (
            <li key={t} className="flex gap-2"><Check size={15} className="mt-0.5 text-primary-ink" />{t}</li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={discard}
        onClose={() => setDiscard(false)}
        title="Discard changes to this section?"
        width={440}
        footer={<><Button onClick={() => setDiscard(false)}>Keep editing</Button><Button variant="danger" onClick={() => { setS(snapshot.current); setDiscard(false); toast('Changes discarded') }}>Discard</Button></>}
      >
        <p className="text-sm text-ink-2">Edits you made in {encounterSections[idx]} since you opened it will be lost. Other sections stay as they are.</p>
      </Modal>

      <Modal open={preview} onClose={() => setPreview(false)} title="Note preview" eyebrow={`${p.name} · ${enc.type} · 16 Jan 2017`} width={680} footer={<Button variant="primary" onClick={() => setPreview(false)}>Close</Button>}>
        <div className="flex flex-col gap-4 text-sm">
          {encounterSections.map((name, i) => {
            let body = s.notAssessed[i] ? 'Not assessed.' : s.notes[i]
            if (i === 6) body = `Weight ${s.vitals.weight} lb · BP ${s.vitals.bp} · Pulse ${s.vitals.pulse || '—'} · Resp ${s.vitals.resp} · SpO2 ${s.vitals.spo2}% RA · Temp ${s.vitals.temp} °F · HbA1c ${s.vitals.hba1c}% · Pain ${s.vitals.pain}/10`
            if (i === 10) body = `PHQ-9 score ${phqScore}, ${phqBand(phqScore).toLowerCase()}. Question 9: ${s.phq[8] ? 'positive' : 'not at all'}.`
            return (
              <div key={name} className="border-b border-hair pb-3 last:border-0">
                <div className="text-label text-ink-2">{name}</div>
                <p className={cx('mt-1', !body && 'text-ink-3')}>{body || 'Not documented yet.'}</p>
              </div>
            )
          })}
        </div>
      </Modal>
    </Page>
  )
}

/* ---------- review the AI draft and sign ---------- */
export function DraftReview() {
  const { id = 'e1' } = useParams()
  const navigate = useNavigate()
  const { encounters, updateEncounter, toast } = useStore()
  const enc = encounters.find((e) => e.id === id) ?? encounters[0]
  const p = patientById(enc.patientId)
  const [med, setMed] = useState<null | '10' | '20'>(null)
  const [signing, setSigning] = useState(false)
  const [edit, setEdit] = useState<string | null>(null)
  const [texts, setTexts] = useState({
    'Present illness': 'Short of breath climbing stairs for about a week. No chest pain. Still sleeps on two pillows, same as before.',
    Vitals: 'BP 132/82 sitting. Pulse 76, irregular. SpO2 97% on room air. Weight 140 lb, up 3 lb since September.',
    'Assessment and plan': 'Type 2 diabetes: HbA1c 9.0. Stomach upset on morning metformin. Agreed to try the extended-release form.\nCKD stage 3: eGFR 48 in December. Recheck with the next bloods.',
  })
  const ready = med !== null
  const sources: Record<string, string[]> = { 'Present illness': ['Transcript 04:12'], Vitals: ['Vitals form'], 'Assessment and plan': ['Transcript 21:30', 'Lab · Dec'] }
  const sign = () => {
    setSigning(true)
    setTimeout(() => {
      updateEncounter(enc.id, { status: 'ready', done: 15, nextStep: 'With coder', closesIn: undefined })
      toast(`Note signed for ${p.name}. Sent to coding.`)
      navigate('/home')
    }, 900)
  }
  return (
    <Page crumbs={[{ label: 'Encounters', to: '/home' }, { label: `${p.name} · ${enc.type}`, to: `/encounter/${enc.id}` }, { label: 'Review draft' }]}>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="flex flex-col">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hair px-6 pb-5 pt-6 sm:px-8">
            <div>
              <div className="flex items-center gap-1.5 text-sm text-ink-2"><Sparkles size={14} className="text-ink" /> Drafted by Landmark Assist · 38-minute visit</div>
              <h1 className="mt-1 text-[28px] font-medium tracking-[-0.6px]">Draft note · {enc.type}</h1>
            </div>
            <span className="font-mono text-mono text-ink-3">{ready ? 4 : 3} of 4 sections ready</span>
          </div>
          <div className="px-6 sm:px-8">
            {Object.entries(texts).map(([name, body]) => (
              <section key={name} className="group border-b border-hair py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-2">{name}</span>
                  <span className="flex items-center gap-3">
                    <button onClick={() => setEdit(edit === name ? null : name)} className="text-sm font-medium text-primary-ink opacity-0 transition-opacity hover:underline focus:opacity-100 group-hover:opacity-100">{edit === name ? 'Done' : 'Edit'}</button>
                    <span className="flex items-center gap-1.5 text-sm"><span className="size-2 rounded-full bg-ink-2" /> Ready</span>
                  </span>
                </div>
                {edit === name ? (
                  <textarea autoFocus value={body} onChange={(e) => setTexts((t) => ({ ...t, [name]: e.target.value }))} rows={4} className="field mt-2 h-auto resize-y py-2.5 leading-relaxed" />
                ) : (
                  body.split('\n').map((l) => <p key={l} className="mt-2 text-body">{l}</p>)
                )}
                <div className="mt-3 flex gap-2">{sources[name].map((x) => <button key={x} onClick={() => toast(`Jumped to ${x}`)} className="rounded-xs border border-hair-strong px-2 py-0.5 font-mono text-mono text-ink-2 hover:border-ink hover:text-ink">{x}</button>)}</div>
              </section>
            ))}
            <motion.section animate={{ backgroundColor: ready ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0)' }} className="py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-2">Medications</span>
                <span className="flex items-center gap-1.5 text-sm">{ready ? <><span className="size-2 rounded-full bg-ink-2" /> Ready</> : <><span className="size-2 rounded-full bg-ink" /> Needs you</>}</span>
              </div>
              <AnimatePresence mode="wait">
                {ready ? (
                  <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-body">Lisinopril {med} mg daily, confirmed with John. {med === '20' ? 'Medication list updated.' : 'Record unchanged.'}</motion.p>
                ) : (
                  <motion.div key="ask" exit={{ opacity: 0 }}>
                    <p className="mt-2 text-body">John said lisinopril 20 mg. The record says 10 mg. Confirm which is right before you sign.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setMed('20')}>20 mg, update the record</Button>
                      <Button size="sm" onClick={() => setMed('10')}>10 mg, keep the record</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-3"><span className="rounded-xs border border-hair-strong px-2 py-0.5 font-mono text-mono text-ink-2">Transcript 26:05</span></div>
            </motion.section>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-hair px-6 py-4 sm:px-8">
            <span className="text-sm text-ink-3">Nothing reaches the chart until you sign.</span>
            <span className="flex-1" />
            <Button onClick={() => navigate(`/encounter/${enc.id}`)}>Back to visit</Button>
            <Tooltip label={ready ? 'Sign and send to coding' : 'Confirm the medication first'} side="top">
              <Button variant="primary" disabled={!ready} loading={signing} onClick={sign}>Sign note</Button>
            </Tooltip>
          </div>
        </Card>
        <Card className="h-fit p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sub text-[18px]">Coding check</h3>
            <span className="flex items-center gap-1.5 text-sm text-ink-2"><span className="size-2 rounded-full bg-ink-2" /> Ready</span>
          </div>
          {[['E11.65', 'Type 2 diabetes, hyperglycaemia', 'Assessment'], ['N18.3', 'CKD stage 3', 'Assessment'], ['I10', 'Hypertension', 'Medications'], ['R06.02', 'Shortness of breath', 'Present illness']].map(([c, n, l]) => (
            <div key={c} className="flex gap-4 border-b border-hair py-3.5">
              <span className="w-14 font-mono text-[14px]">{c}</span>
              <span><span className="block text-body">{n}</span><span className="block text-sm text-ink-3">Linked to {l}</span></span>
            </div>
          ))}
          <p className="mt-4 flex gap-2 text-sm text-ink-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-ink" /> Every diagnosis is linked to a section. Unlinked diagnoses caused most returns last quarter.</p>
          <button onClick={() => navigate('/metrics')} className="mt-3 text-sm font-medium text-primary-ink hover:underline">See why notes come back</button>
        </Card>
      </div>
    </Page>
  )
}

export { AlertTriangle, X }
