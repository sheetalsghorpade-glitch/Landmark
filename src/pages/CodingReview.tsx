import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Flag, Inbox, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Avatar, Button, Card, EmptyState, RagChip, Reveal, Segmented, cx, ease } from '../components/ui'
import { encounterNoteSections, patientById } from '../data/mock'
import { statusMeta, useStore } from '../store'

type Tab = 'returned' | 'with' | 'completed'

export default function CodingReview() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { encounters, notes, updateEncounter, resolveNote, addNote, toast } = useStore()
  const [q, setQ] = useState('')
  const tab = (params.get('tab') as Tab) || (params.get('e') && encounters.find((e) => e.id === params.get('e'))?.status === 'ready' ? 'with' : 'returned')
  const lists: Record<Tab, typeof encounters> = {
    returned: encounters.filter((e) => e.status === 'returned'),
    with: encounters.filter((e) => e.status === 'ready'),
    completed: encounters.filter((e) => e.status === 'coded'),
  }
  const list = lists[tab].filter((e) => patientById(e.patientId).name.toLowerCase().includes(q.toLowerCase()))
  const selId = params.get('e') && list.some((e) => e.id === params.get('e')) ? params.get('e')! : list[0]?.id
  const sel = encounters.find((e) => e.id === selId)
  const encNotes = notes.filter((n) => n.encounterId === selId)
  const open = encNotes.find((n) => !n.resolved)
  const [reply, setReply] = useState('')
  const [highlight, setHighlight] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setReply(selId === 'e2' ? 'Stage 3, eGFR 48 on 12 Sep 2016. Updated in the plan.' : '')
    setHighlight(open?.section ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId])

  const select = (id: string) => setParams({ tab, e: id }, { replace: true })
  const jump = (section: string) => {
    setHighlight(section)
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const resubmit = () => {
    if (!sel || !open) return
    if (!reply.trim()) return
    setBusy(true)
    setTimeout(() => {
      addNote({ id: 'r' + Date.now(), encounterId: sel.id, author: 'Dr Michael Wong', authorInitials: 'MW', date: '16 Jan 2017', title: 'Reply', body: reply, section: open.section, resolved: true })
      resolveNote(open.id)
      updateEncounter(sel.id, { status: 'ready', nextStep: 'With coder' })
      setBusy(false)
      toast(`Resubmitted ${patientById(sel.patientId).name} to coding`, { label: 'Undo', run: () => updateEncounter(sel.id, { status: 'returned', nextStep: 'Add CKD stage' }) })
      setParams({ tab: 'returned' }, { replace: true })
    }, 700)
  }
  const counts = { returned: lists.returned.length, with: lists.with.length, completed: lists.completed.length }

  return (
    <Page crumbs={[{ label: 'Workspace' }, { label: 'Coding review' }]}>
      <Reveal className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-heading">Coding review</h1>
          <p className="mt-0.5 text-sm text-ink-2">{counts.returned} encounters returned to you · {counts.with} with coders</p>
        </div>
        <div className="flex-1" />
        <Segmented
          id="coding-tab"
          value={tab}
          onChange={(t) => setParams({ tab: t }, { replace: true })}
          options={[
            { value: 'returned', label: <span>Returned <span className="font-mono">{counts.returned}</span></span> },
            { value: 'with', label: <span>With coders <span className="font-mono">{counts.with}</span></span> },
            { value: 'completed', label: 'Completed' },
          ]}
        />
      </Reveal>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[260px_1fr_320px] 2xl:grid-cols-[320px_1fr_380px]">
        <Card className="h-fit overflow-hidden">
          <div className="relative border-b border-hair">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter encounters" className="h-[52px] w-full bg-transparent pl-11 pr-4 text-body outline-none placeholder:text-ink-3" />
          </div>
          <AnimatePresence initial={false} mode="popLayout">
            {list.length === 0 && <EmptyState icon={<Inbox size={18} />} title={tab === 'returned' ? 'Nothing returned to you' : 'Nothing here'} body={tab === 'returned' ? 'Coders have no open questions. Nice work.' : 'Encounters will show here when there are some.'} />}
            {list.map((e) => {
              const p = patientById(e.patientId)
              const on = e.id === selId
              return (
                <motion.button
                  layout
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -16 }}
                  onClick={() => select(e.id)}
                  className={cx('flex w-full gap-3 border-b border-hair px-5 py-4 text-left transition-colors last:border-0', on ? 'bg-select' : 'hover:bg-select/50')}
                >
                  <Avatar initials={p.initials} className={on ? 'bg-canvas' : ''} />
                  <span className="flex flex-col gap-1.5">
                    <span className="text-body font-medium">{p.name}</span>
                    <span className="font-mono text-mono text-ink-2">{p.mrn} · {e.date}</span>
                    <RagChip rag={statusMeta[e.status].rag} className="w-fit">{statusMeta[e.status].label}</RagChip>
                  </span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </Card>

        {sel ? (
          <>
            <Card key={'rec' + sel.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-hair px-6 py-5">
                <Avatar initials={patientById(sel.patientId).initials} size={40} />
                <div className="flex-1">
                  <div className="text-sub text-[18px]">{patientById(sel.patientId).name}</div>
                  <div className="font-mono text-mono text-ink-2">{sel.date} · {sel.type.replace(' visit', '')}</div>
                </div>
                <Button onClick={() => navigate(`/patients/${sel.patientId}`)}>Open record</Button>
              </div>
              {encounterNoteSections.map((s) => {
                const flagged = highlight === s.name && open
                return (
                  <motion.div
                    key={s.name}
                    ref={(el) => (sectionRefs.current[s.name] = el)}
                    animate={{ backgroundColor: flagged ? 'rgb(243 243 243)' : 'rgba(255,255,255,0)' }}
                    className="border-b border-hair px-6 py-5 last:border-0"
                  >
                    <div className="flex items-center gap-2 text-sm text-ink-2">
                      {s.name}
                      {flagged && (
                        <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-xs bg-ink px-2 py-0.5 text-label text-white">
                          <Flag size={11} /> Note 1
                        </motion.span>
                      )}
                    </div>
                    {s.text.split('\n').map((l) => <p key={l} className="mt-1.5 text-body text-ink-2">{l}</p>)}
                  </motion.div>
                )
              })}
            </Card>

            <Card key={'notes' + sel.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05, ease }} className="flex flex-col p-6 lg:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sub text-[18px]">Coder notes</h2>
                <span className="font-mono text-mono text-ink-3">{encNotes.length}</span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {encNotes.length === 0 && <p className="py-6 text-center text-sm text-ink-3">No notes on this encounter.</p>}
                {encNotes.map((n) => (
                  <div key={n.id} className={cx('rounded-lg border p-5', !n.resolved ? 'border-primary' : 'border-hair')}>
                    <div className="flex items-center gap-3">
                      <Avatar initials={n.authorInitials} />
                      <div className="flex-1">
                        <div className="text-body font-medium">{n.author}</div>
                        <div className="font-mono text-mono text-ink-2">{n.date}</div>
                      </div>
                      {n.resolved ? <span className="flex items-center gap-1.5 text-sm"><span className="size-2 rounded-full bg-ink-2" /> Resolved</span> : <RagChip rag="amber">Open</RagChip>}
                    </div>
                    {n.title !== 'Reply' && <div className="mt-3 text-body font-medium">{n.title}</div>}
                    <p className="mt-1.5 text-body text-ink-2">{n.body}</p>
                    {!n.resolved && (
                      <button onClick={() => jump(n.section)} className="mt-3 flex items-center gap-1 text-body font-medium text-primary-ink hover:underline">
                        Go to {n.section} <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex-1" />
              {open && tab === 'returned' && (
                <div className="mt-6 overflow-hidden rounded-lg border border-hair-strong focus-within:border-ink">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Reply to the coder" className="w-full resize-none bg-transparent px-4 py-3 text-body outline-none placeholder:text-ink-3" />
                  <div className="flex items-center gap-3 bg-select/70 px-3 py-2.5">
                    <span className="text-sm text-ink-3">Reply to {open.author}</span>
                    <span className="flex-1" />
                    <Button variant="primary" disabled={!reply.trim()} loading={busy} onClick={resubmit}>Resubmit</Button>
                  </div>
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </Page>
  )
}
