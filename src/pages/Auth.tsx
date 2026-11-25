import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Eye, EyeOff, FileText, Home, Lock, Users } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Logo, cx, ease } from '../components/ui'
import type { Role } from '../data/mock'
import { useStore } from '../store'

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-[44%] max-w-[640px] flex-col bg-select px-16 py-14 lg:flex">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-body font-medium">Landmark</span>
          <span className="text-label text-ink-2">EMR</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="text-[32px] font-medium leading-[1.1] tracking-[-0.74px]">
            Care that comes home.
          </motion.h1>
          <p className="mt-4 max-w-[480px] text-body text-ink-2">Document home visits, follow up with your panel and close coding gaps from one workspace.</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
            className="card mt-8 flex max-w-[490px] items-center gap-3.5 p-[18px]"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-on"><Clock size={20} /></span>
            <span>
              <span className="block text-label text-primary-ink">Closes in 4 hrs</span>
              <span className="block text-sm font-medium">Finish John Susliet's encounter</span>
              <span className="block text-cap text-ink-3">Pulse and assessment and plan still needed</span>
            </span>
          </motion.div>
        </div>
        <div className="flex gap-6 text-cap text-ink-2">
          {['HIPAA compliant', 'Single sign-on', '15 min idle timeout'].map((t) => (
            <span key={t} className="flex items-center gap-1.5"><Lock size={13} /> {t}</span>
          ))}
        </div>
      </aside>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-body font-medium">Landmark</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

export function SignIn() {
  const navigate = useNavigate()
  const { toast } = useStore()
  const [email, setEmail] = useState('m.wong@landmarkhealth.example')
  const [pw, setPw] = useState('demo-password')
  const [show, setShow] = useState(false)
  const [keep, setKeep] = useState(false)
  const [tried, setTried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reset, setReset] = useState(false)
  const [sent, setSent] = useState(false)

  const emailErr = !/^\S+@\S+\.\S+$/.test(email) ? 'Enter your work email, like name@landmarkhealth.example' : ''
  const pwErr = pw.length < 8 ? 'Password must be at least 8 characters' : ''

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (emailErr || pwErr) return
    setLoading(true)
    setTimeout(() => navigate('/verify'), 700)
  }

  if (reset)
    return (
      <AuthLayout>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <span className="mb-5 flex size-10 items-center justify-center rounded-full bg-green-wash text-rag-green"><Check size={20} /></span>
              <h1 className="text-heading">Check your email</h1>
              <p className="mt-2 text-sm text-ink-2">We sent a reset link to {email}. It expires in 30 minutes.</p>
              <Button className="mt-8 w-full" size="lg" onClick={() => { setReset(false); setSent(false) }}>Back to sign in</Button>
            </motion.div>
          ) : (
            <motion.form key="reset" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); if (!emailErr) setSent(true); else setTried(true) }}>
              <h1 className="text-heading">Reset password</h1>
              <p className="mt-2 text-sm text-ink-2">Enter your work email and we'll send a reset link.</p>
              <div className="mt-8">
                <Field label="Work email" error={tried ? emailErr : ''}>
                  <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" variant="primary" size="lg" className="mt-6 w-full">Send reset link</Button>
              <button type="button" onClick={() => setReset(false)} className="mt-4 text-sm text-ink-2 hover:text-ink">Back to sign in</button>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthLayout>
    )

  return (
    <AuthLayout>
      <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} onSubmit={submit} noValidate>
        <h1 className="text-heading">Sign in</h1>
        <p className="mt-2 text-sm text-ink-2">Use your Landmark work account.</p>
        <div className="mt-8 flex flex-col gap-5">
          <Field label="Work email" error={tried ? emailErr : ''}>
            <input type="email" autoComplete="username" className={cx('field', tried && emailErr && '!border-rag-red')} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field
            label="Password"
            error={tried ? pwErr : ''}
            right={<button type="button" onClick={() => setReset(true)} className="font-medium text-primary-ink hover:underline">Forgot password?</button>}
          >
            <span className="relative block">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" className={cx('field pr-11', tried && pwErr && '!border-rag-red')} value={pw} onChange={(e) => setPw(e.target.value)} />
              <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 text-body text-ink-2">
            <Checkbox checked={keep} onChange={setKeep} /> Keep me signed in on this device
          </label>
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-6 w-full">Sign in</Button>
        <div className="my-5 flex items-center gap-4 text-cap text-ink-3"><span className="h-px flex-1 bg-hair" />or<span className="h-px flex-1 bg-hair" /></div>
        <Button type="button" size="lg" className="w-full" onClick={() => { toast('Redirecting to your organisation'); setTimeout(() => navigate('/verify'), 600) }}>
          Continue with organisation SSO
        </Button>
        <p className="mt-6 text-cap text-ink-3">On a shared or clinic device? Sign out when you leave. Need access? Contact your Landmark administrator.</p>
        <p className="mt-6 rounded-md bg-select px-3 py-2 text-cap text-ink-2">Demo: the details are filled in. Press Sign in.</p>
      </motion.form>
    </AuthLayout>
  )
}

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx('flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors', checked ? 'border-primary bg-primary text-primary-on' : 'border-hair-strong bg-canvas hover:border-ink-faint')}
    >
      <AnimatePresence>{checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={12} strokeWidth={3} /></motion.span>}</AnimatePresence>
    </button>
  )
}

export function Verify() {
  const navigate = useNavigate()
  const [code, setCode] = useState(['4', '8', '2', '6', '', ''])
  const [trust, setTrust] = useState(true)
  const [secs, setSecs] = useState(24)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    refs.current[4]?.focus()
  }, [])
  useEffect(() => {
    if (secs <= 0) return
    const t = setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secs])

  const set = (i: number, v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length > 1) {
      const next = [...code]
      digits.slice(0, 6 - i).split('').forEach((d, k) => (next[i + k] = d))
      setCode(next)
      refs.current[Math.min(i + digits.length, 5)]?.focus()
      return
    }
    const next = [...code]
    next[i] = digits
    setCode(next)
    setErr('')
    if (digits && i < 5) refs.current[i + 1]?.focus()
  }
  const verify = () => {
    if (code.some((c) => !c)) {
      setErr('Enter all 6 digits')
      return
    }
    setLoading(true)
    setTimeout(() => navigate('/role'), 600)
  }
  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-heading">Check your phone</h1>
        <p className="mt-2 text-sm text-ink-2">Enter the 6-digit code we sent to the phone ending 4821.</p>
        <motion.div animate={err ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }} className="mt-8 flex gap-2.5">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={c}
              inputMode="numeric"
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !c && i > 0) refs.current[i - 1]?.focus()
                if (e.key === 'Enter') verify()
              }}
              className={cx('h-[60px] w-full max-w-[56px] rounded-md border text-center font-sans text-[24px] outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink', err && !c ? 'border-rag-red' : 'border-hair-strong')}
            />
          ))}
        </motion.div>
        {err && <p className="mt-2 text-cap text-rag-red">{err}</p>}
        <div className="mt-4 flex items-center gap-1.5 text-cap text-ink-2">
          <Clock size={13} />
          {secs > 0 ? `Resend code in 0:${String(secs).padStart(2, '0')}` : <button onClick={() => setSecs(30)} className="font-medium text-primary-ink hover:underline">Resend code</button>}
        </div>
        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-body text-ink-2">
          <Checkbox checked={trust} onChange={setTrust} /> Trust this device for 12 hours
        </label>
        <Button variant="primary" size="lg" loading={loading} className="mt-6 w-full" onClick={verify}>Verify</Button>
        <div className="mt-4 flex gap-5 text-sm">
          <button className="font-medium text-primary-ink hover:underline" onClick={() => setErr('')}>Use another method</button>
          <button className="text-ink-2 hover:text-ink" onClick={() => navigate('/signin')}>Back to sign in</button>
        </div>
      </motion.div>
    </AuthLayout>
  )
}

export function ChooseRole() {
  const navigate = useNavigate()
  const { setRole, setFirstRun } = useStore()
  const [sel, setSel] = useState<Role>('provider')
  const roles = [
    { v: 'provider' as Role, icon: Home, title: 'Provider', body: 'Document home visits and manage your encounters.', points: ['Day plan with drive times', 'Guided 15-section encounter', 'Coding returns in one queue'], start: 'Home', to: '/home' },
    { v: 'nurse' as Role, icon: Users, title: 'Nurse care manager', body: 'Keep patients stable between visits.', points: ['Panel by acuity', 'Open measures per patient', 'Follow-up tasks with owners'], start: 'Care gaps', to: '/patients' },
    { v: 'coder' as Role, icon: FileText, title: 'Medical coder', body: 'Review encounters and send notes to providers.', points: ['Encounters ready for coding', 'Notes anchored to sections', 'Resubmissions tracked'], start: 'Coding review', to: '/coding' },
  ]
  const current = roles.find((r) => r.v === sel)!
  return (
    <div className="flex min-h-full flex-col px-6 py-8 lg:px-[88px]">
      <div className="flex items-center gap-2.5">
        <Logo size={32} />
        <span className="text-body font-medium">Landmark</span>
        <span className="text-label text-ink-2">EMR</span>
        <span className="flex-1" />
        <span className="hidden items-center gap-3 text-body text-ink-2 sm:flex">
          <span className="flex size-8 items-center justify-center rounded-xs bg-ink text-cap font-medium text-white">MW</span>
          m.wong@landmarkhealth.example
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-heading">How will you use Landmark today?</motion.h1>
        <p className="mt-3 text-center text-sm text-ink-2">Your account has three roles. You can switch any time from your profile menu.</p>
        <div role="radiogroup" className="mt-10 grid w-full max-w-[1060px] gap-5 md:grid-cols-3">
          {roles.map((r, i) => {
            const on = sel === r.v
            return (
              <motion.button
                key={r.v}
                role="radio"
                aria-checked={on}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4, ease }}
                whileHover={{ y: -2 }}
                onClick={() => setSel(r.v)}
                onDoubleClick={() => { setRole(r.v); setFirstRun(true); navigate(r.to) }}
                className={cx('rounded-xl border bg-canvas p-6 text-left transition-[border-color,box-shadow]', on ? 'border-ink shadow-card' : 'border-hair hover:border-hair-strong')}
              >
                <div className="flex items-start justify-between">
                  <span className={cx('flex size-10 items-center justify-center rounded-lg transition-colors', on ? 'bg-primary text-primary-on' : 'bg-select text-ink')}>
                    <r.icon size={18} />
                  </span>
                  <span className={cx('flex size-[18px] items-center justify-center rounded-full border-[1.5px] transition-colors', on ? 'border-primary-ink' : 'border-hair-strong')}>
                    {on && <motion.span layoutId="role-dot" className="size-2 rounded-full bg-primary-ink" />}
                  </span>
                </div>
                <h2 className="mt-4 text-sub text-[16px]">{r.title}</h2>
                <p className="mt-2 text-body text-ink-2">{r.body}</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-ink-2"><Check size={14} className="text-primary-ink" /> {p}</li>
                  ))}
                </ul>
                <div className="mt-5 border-t border-hair pt-4 text-cap text-ink-2">Starts on <span className="ml-1 font-mono text-mono text-ink">{r.start}</span></div>
              </motion.button>
            )
          })}
        </div>
        <Button variant="primary" size="lg" className="mt-10" onClick={() => { setRole(sel); setFirstRun(true); navigate(current.to) }}>
          Continue as {current.title}
        </Button>
        <button onClick={() => navigate('/signin')} className="mt-4 text-sm text-ink-2 hover:text-ink">Not Michael? Sign out</button>
      </div>
    </div>
  )
}
