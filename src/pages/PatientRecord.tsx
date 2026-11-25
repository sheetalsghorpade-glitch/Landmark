import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronRight, Download, Eye, FileText, Phone, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Avatar, Button, Card, CardHeader, Modal, RagChip, Reveal, Segmented, Tabs, Tooltip, cx, ease, popMotion, useOutside } from '../components/ui'
import { briefSources, medications, patientById, problems, type Rag } from '../data/mock'
import { statusMeta, useStore } from '../store'

type Tab = 'summary' | 'operational' | 'demographics' | 'encounters' | 'documents'

const actionItems = {
  provider: [
    { t: 'Recheck INR and adjust warfarin', when: 'Today' },
    { t: 'Look into evening confusion', when: 'New' },
    { t: 'Reconcile medications', when: 'Overdue' },
  ],
  carer: [
    { t: 'Set out evening tablets in the weekly box', when: 'Daily' },
    { t: 'Note any bruising, bleeding or falls', when: 'Daily' },
    { t: 'Have John ready for the INR draw on Tuesday', when: 'Tue' },
  ],
}

function SourcesPopover() {
  const [open, setOpen] = useState(false)
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-primary-ink hover:underline">From 9 sources</button>
      <AnimatePresence>
        {open && (
          <motion.div {...popMotion} className="absolute left-0 top-7 z-30 w-[340px] rounded-xl border border-hair bg-canvas p-2 shadow-pop">
            <div className="px-2 pb-1 pt-1 text-label text-ink-3">The summary is built from</div>
            {briefSources.map((s) => (
              <div key={s.label} className="rounded-md px-2 py-2 hover:bg-select">
                <div className="font-mono text-[11.5px] text-ink-2">{s.label}</div>
                <div className="text-cap">{s.text}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Summary({ pid }: { pid: string }) {
  const { open, addTask, toast } = useStore()
  const navigate = useNavigate()
  const [who, setWho] = useState<'provider' | 'carer'>('provider')
  const [added, setAdded] = useState(false)
  const [probs, setProbs] = useState(problems)
  const [schedule, setSchedule] = useState<string | null>(null)
  const [slot, setSlot] = useState('Tue 24')
  const [reconciled, setReconciled] = useState(false)
  const p = patientById(pid)
  const isJs = pid === 'js'
  const items = actionItems[who]
  const addAll = () => {
    items.forEach((i) => addTask({ title: i.t, patientId: pid, status: 'todo', due: i.when === 'Today' ? 'Today' : 'Fri 20', owner: who === 'provider' ? 'YO' : 'KW' }))
    setAdded(true)
    toast(`${items.length} tasks added for ${who === 'provider' ? 'you' : 'Kay Williams'}`, { label: 'View', run: () => navigate('/tasks') })
  }
  const act = (id: string, action: string) => {
    if (action === 'Schedule') return setSchedule(id)
    if (action === 'Address today') {
      setProbs((ps) => ps.map((x) => (x.id === id ? { ...x, action: 'Added to plan' } : x)))
      toast('Added to today’s assessment and plan')
    }
    if (action === 'Review') navigate('/encounter/e1?step=7')
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_332px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Reveal>
          <Card className="p-5">
            <CardHeader
              title={<span className="flex items-center gap-2"><Sparkles size={16} /> Summary <span className="text-sm font-normal text-ink-3">Landmark Assist · 13 Jan</span></span>}
              right={<button onClick={() => open('brief', { patientId: pid })} className="text-sm font-medium text-primary-ink hover:underline">Read visit brief</button>}
            />
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr]">
              <div className="flex flex-col gap-3 text-body">
                <p>{isJs ? '85, with COPD, heart failure, atrial fibrillation and dementia. Lives with his wife Mary, who is his proxy. DNR.' : `${p.age}, ${p.sex.toLowerCase()}, acuity ${p.acuity}. Lives in ${p.town}. Seen by ${p.pcp}.`}</p>
                <p>{isJs ? 'Since 05 Jan: INR up to 3.8 after missed and doubled warfarin doses, new confusion in the evenings, and home blood pressure above target.' : 'No changes flagged since the last visit. Two care measures are still open this year.'}</p>
                <SourcesPopover />
              </div>
              <div className="border-hair md:border-l md:pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-body font-medium">Action items</span>
                  <Segmented id="who" value={who} onChange={(v) => { setWho(v); setAdded(false) }} options={[{ value: 'provider', label: 'Provider' }, { value: 'carer', label: 'Carer' }]} />
                </div>
                <AnimatePresence mode="wait">
                  <motion.ol key={who} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.2 }} className="mt-2">
                    {items.map((it, i) => (
                      <li key={it.t} className="flex items-start gap-3 border-b border-hair py-3 last:border-0">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-select text-cap font-medium">{i + 1}</span>
                        <span className="flex-1 text-body">{it.t}</span>
                        <span className={cx('text-sm', it.when === 'Overdue' ? 'text-rag-red' : 'text-ink-2')}>{it.when}</span>
                      </li>
                    ))}
                  </motion.ol>
                </AnimatePresence>
                <button disabled={added} onClick={addAll} className="mt-2 text-sm font-medium text-primary-ink hover:underline disabled:text-ink-3 disabled:no-underline">
                  {added ? 'Added to tasks' : who === 'provider' ? 'Add all to my tasks' : 'Send to Kay Williams'}
                </button>
              </div>
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <Card className="overflow-hidden">
            <div className="px-5 pt-5">
              <CardHeader title="Problem list" count={`${probs.length} · ${probs.filter((x) => x.rag === 'red').length} unstable`} right={<button onClick={() => toast('Problem history opened')} className="text-sm font-medium text-primary-ink hover:underline">View history</button>} />
            </div>
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="border-b border-hair text-label text-ink-2">
                  <th className="px-5 py-2.5 font-medium">Condition</th>
                  <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Last addressed</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {probs.map((r) => (
                  <tr key={r.id} className="border-b border-hair transition-colors last:border-0 hover:bg-select/40">
                    <td className="px-5 py-3 text-body">{r.name}</td>
                    <td className="hidden px-3 py-3 font-mono text-mono text-ink-2 sm:table-cell">{r.last}</td>
                    <td className="px-3 py-3"><RagChip rag={r.rag as Rag}>{r.status}</RagChip></td>
                    <td className="px-5 py-3 text-right">
                      {r.action.startsWith('Added') || r.action.startsWith('Booked') ? (
                        <span className="text-sm text-ink-3">{r.action}</span>
                      ) : r.action ? (
                        <button onClick={() => act(r.id, r.action)} className="text-body font-medium text-primary-ink hover:underline">{r.action}</button>
                      ) : (
                        <span className="text-sm text-ink-3">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Reveal>
      </div>
      <div className="flex flex-col gap-4">
        <Reveal delay={0.04}>
          <Card className="p-5">
            <h2 className="text-body font-medium">Safety and wishes</h2>
            {p.safety ? (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-body font-medium"><AlertTriangle size={16} /> {p.safety}</div>
                <p className="mt-1 text-sm text-ink-2">Bring an escort. Call <button onClick={() => toast('Calling 503 823 3333')} className="underline underline-offset-2 hover:text-ink">503 823 3333</button> 30 minutes before arriving.</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-3">No safety notes recorded.</p>
            )}
            <div className="mt-4 border-t border-hair pt-4">
              <div className="text-body font-medium">{p.codeStatus ? `${p.codeStatus} · POLST 20 Oct 2016` : 'Full code'}</div>
              <p className="mt-1 text-sm text-ink-2">{p.codeStatus ? 'Full supportive care otherwise. Mary decides if he cannot.' : 'No advance directive on file. Discuss at the next annual visit.'}</p>
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="p-5">
            <CardHeader
              title="Medications"
              count={medications.length}
              right={
                <button onClick={() => { setReconciled(true); toast('Medications reconciled') }} className={cx('text-sm', reconciled ? 'text-rag-green' : 'text-ink-3 hover:text-ink')}>
                  {reconciled ? 'Reconciled today' : 'Reconciled 21 Jun'}
                </button>
              }
            />
            <ul className="mt-3">
              {medications.map((m) => (
                <li key={m.name} className="flex items-center justify-between border-b border-hair py-2.5 last:border-0">
                  <span className="text-body">{m.name}</span>
                  <span className="font-mono text-mono text-ink-2">{m.dose}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
        <Reveal delay={0.12}>
          <Card className="p-5">
            <CardHeader title="Care team" count={2} />
            {[
              ['MJ', 'Dr Matthew Johnson', 'Provider'],
              ['KW', 'Kay Williams, RN', 'Care manager'],
            ].map(([i, n, r]) => (
              <button key={n} onClick={() => open('message', { patientId: pid })} className="mt-3 flex w-full items-center gap-3 rounded-md text-left hover:bg-select/50">
                <Avatar initials={i} />
                <span className="flex-1"><span className="block text-body font-medium">{n}</span><span className="block text-cap text-ink-3">{r}</span></span>
                <Phone size={15} className="text-ink-3" />
              </button>
            ))}
          </Card>
        </Reveal>
      </div>
      <Modal
        open={!!schedule}
        onClose={() => setSchedule(null)}
        title="Schedule anaemia review"
        width={420}
        footer={<><Button onClick={() => setSchedule(null)}>Cancel</Button><Button variant="primary" onClick={() => { setProbs((ps) => ps.map((x) => (x.id === schedule ? { ...x, action: `Booked ${slot}` } : x))); setSchedule(null); toast(`CBC booked for ${slot} Jan`) }}>Book</Button></>}
      >
        <p className="text-sm text-ink-2">Due this year. Book a CBC with the next home lab draw.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['Tue 17', 'Fri 20', 'Tue 24'].map((d) => (
            <button key={d} aria-pressed={slot === d} onClick={() => setSlot(d)} className={cx('rounded-md border px-3 py-3 text-sm transition-colors', slot === d ? 'border-ink font-medium' : 'border-hair hover:border-hair-strong')}>{d}</button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function KV({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-cap text-ink-3">{k}</dt>
          <dd className="mt-0.5 text-body">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Operational({ pid }: { pid: string }) {
  const p = patientById(pid)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-4 text-body font-medium">Coverage and programme</h2>
        <KV rows={[['Health plan', p.plan], ['Member ID', 'BX' + p.mrn.slice(-6)], ['Programme', 'Landmark home-based care'], ['Enrolled', '04 Mar 2015'], ['Acuity', p.acuity], ['Engagement', 'Engaged']]} />
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 text-body font-medium">Visits this year</h2>
        <KV rows={[['Annual visit', 'Done 20 Oct 2016'], ['Maintenance visits', '4 of 6'], ['Next visit', 'Today, 15:00'], ['Average drive', '22 min'], ['Missed visits', '0'], ['Telephonic', '2']]} />
      </Card>
    </div>
  )
}

function Demographics({ pid }: { pid: string }) {
  const p = patientById(pid)
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-body font-medium">Patient details</h2>
      <KV rows={[['Full name', p.name], ['Date of birth', `${p.dob} (${p.age})`], ['Sex', p.sex], ['Address', p.address], ['Phone', p.phone], ['Preferred language', 'English'], ['Proxy', pid === 'js' ? 'Mary Smith, wife' : 'None recorded'], ['Primary care', p.pcp], ['MRN', p.mrn]]} />
    </Card>
  )
}

function Encounters({ pid }: { pid: string }) {
  const { encounters } = useStore()
  const navigate = useNavigate()
  const list = encounters.filter((e) => e.patientId === pid)
  return (
    <Card className="overflow-hidden">
      {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-3">No encounters yet for this patient.</p>}
      {list.map((e) => (
        <button key={e.id} onClick={() => navigate(e.status === 'open' ? `/encounter/${e.id}` : `/coding?e=${e.id}`)} className="group flex w-full items-center gap-4 border-b border-hair px-5 py-3.5 text-left last:border-0 hover:bg-select/50">
          <span className="w-[100px] font-mono text-mono text-ink-2">{e.date}</span>
          <span className="flex-1 text-body">{e.type}</span>
          <RagChip rag={statusMeta[e.status].rag}>{statusMeta[e.status].label}</RagChip>
          <ChevronRight size={16} className="text-ink-3 group-hover:text-ink" />
        </button>
      ))}
    </Card>
  )
}

function Documents() {
  const [preview, setPreview] = useState<string | null>(null)
  const docs = [
    ['POLST form', 'Advance care plan', '20 Oct 2016'],
    ['Discharge summary, Buffalo General', 'Hospital', '28 Sep 2016'],
    ['Memory clinic referral', 'Referral', '11 Jan 2017'],
    ['INR lab report', 'Lab', '13 Jan 2017'],
    ['Home safety assessment', 'Safety', '02 Jan 2017'],
  ]
  return (
    <Card className="overflow-hidden">
      {docs.map(([n, t, d]) => (
        <div key={n} className="group flex items-center gap-4 border-b border-hair px-5 py-3.5 last:border-0 hover:bg-select/40">
          <FileText size={18} className="text-ink-2" />
          <span className="flex-1"><span className="block text-body">{n}</span><span className="block text-cap text-ink-3">{t}</span></span>
          <span className="hidden font-mono text-mono text-ink-2 sm:block">{d}</span>
          <Tooltip label="Preview"><button aria-label={`Preview ${n}`} onClick={() => setPreview(n)} className="rounded-xs p-1.5 text-ink-2 hover:bg-select hover:text-ink"><Eye size={16} /></button></Tooltip>
        </div>
      ))}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ?? ''} width={620} footer={<><Button icon={<Download size={15} />} onClick={() => setPreview(null)}>Download PDF</Button><Button variant="primary" onClick={() => setPreview(null)}>Done</Button></>}>
        <div className="flex h-[360px] flex-col gap-3 rounded-lg border border-hair bg-select/50 p-8">
          <div className="h-4 w-1/3 rounded-xs bg-hair" />
          {[92, 88, 95, 70, 84, 90, 60].map((w, i) => <div key={i} className="h-2.5 rounded-xs bg-hair" style={{ width: w + '%' }} />)}
          <div className="mt-6 h-2.5 w-1/2 rounded-xs bg-hair" />
          <div className="h-2.5 w-2/5 rounded-xs bg-hair" />
        </div>
      </Modal>
    </Card>
  )
}

export default function PatientRecord() {
  const { id = 'js' } = useParams()
  const [params, setParams] = useSearchParams()
  const { open, encounters } = useStore()
  const tab = (params.get('tab') as Tab) || 'summary'
  const p = patientById(id) ?? patientById('js')
  const enc = encounters.filter((e) => e.patientId === p.id).length
  return (
    <Page crumbs={[{ label: 'Patients', to: '/patients' }, { label: p.name }]} actions={<span />}>
      <div className="flex flex-col gap-4">
        <Reveal>
          <Card className="px-5 pt-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-5 pb-5">
              <Avatar initials={p.initials} size={64} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[24px] font-medium tracking-[-0.4px]">{p.name}</h1>
                  {p.codeStatus && (
                    <Tooltip label="Do not resuscitate · POLST 20 Oct 2016">
                      <span className="rounded-xs border border-ink px-2 py-0.5 text-label">{p.codeStatus}</span>
                    </Tooltip>
                  )}
                  <span className="rounded-xs bg-select px-2 py-0.5 text-label text-ink-2">Acuity {p.acuity}</span>
                  <span className="flex items-center gap-1.5 text-body"><span className="size-2 rounded-full bg-ink" /> Engaged</span>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
                  {[['Age', `${p.age} · ${p.sex}`], ['Date of birth', p.dob], ['MRN', p.mrn], ['Health plan', p.plan], ['PCP', p.pcp]].map(([k, v]) => (
                    <div key={k}><dt className="text-cap text-ink-3">{k}</dt><dd className={cx('text-body', k === 'MRN' && 'font-mono text-[15px]')}>{v}</dd></div>
                  ))}
                </dl>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => open('message', { patientId: p.id })}>Message care manager</Button>
                <Button variant="primary" onClick={() => open('newEncounter', { patientId: p.id })}>New encounter</Button>
              </div>
            </div>
            <div className="border-t border-hair pt-3">
              <Tabs
                id="patient"
                value={tab}
                onChange={(t) => setParams(t === 'summary' ? {} : { tab: t }, { replace: true })}
                tabs={[
                  { value: 'summary', label: 'Clinical summary' },
                  { value: 'operational', label: 'Operational' },
                  { value: 'demographics', label: 'Demographics' },
                  { value: 'encounters', label: 'Encounters', count: enc },
                  { value: 'documents', label: 'Documents', count: 5 },
                ]}
              />
            </div>
          </Card>
        </Reveal>
        <motion.div key={tab + p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease }}>
            {tab === 'summary' && <Summary pid={p.id} />}
            {tab === 'operational' && <Operational pid={p.id} />}
            {tab === 'demographics' && <Demographics pid={p.id} />}
            {tab === 'encounters' && <Encounters pid={p.id} />}
            {tab === 'documents' && <Documents />}
        </motion.div>
      </div>
    </Page>
  )
}
