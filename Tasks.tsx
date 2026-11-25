import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, CheckCircle2, CircleDashed, Clock, Plus, X, CircleDot, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Shell'
import { Avatar, Button, Card, Drawer, Field, Reveal, Segmented, cx, ease } from '../components/ui'
import { patientById, type Task, type TaskStatus } from '../data/mock'
import { useStore } from '../store'

const cols: { v: TaskStatus; label: string; icon: typeof Clock }[] = [
  { v: 'todo', label: 'To do', icon: CircleDashed },
  { v: 'progress', label: 'In progress', icon: CircleDot },
  { v: 'waiting', label: 'Waiting', icon: Clock },
  { v: 'done', label: 'Done', icon: CheckCircle2 },
]
const owners: Record<string, string> = { YO: 'You', KW: 'Kay Williams, RN', FD: 'Fiona Doyle' }

function TaskCard({ t, onOpen, onDrag }: { t: Task; onOpen: () => void; onDrag: (id: string | null) => void }) {
  const p = patientById(t.patientId)
  const today = t.due === 'Today'
  return (
    <motion.div
      layout
      layoutId={t.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease }}
      whileHover={{ y: -2 }}
      draggable
      onDragStart={(e) => {
        ;(e as unknown as DragEvent).dataTransfer?.setData('text/plain', t.id)
        onDrag(t.id)
      }}
      onDragEnd={() => onDrag(null)}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      tabIndex={0}
      role="button"
      aria-label={`${t.title}, ${p.name}, due ${t.due}`}
      className="cursor-grab rounded-lg border border-hair bg-canvas p-4 shadow-[0_1px_2px_rgba(5,5,5,0.05)] transition-shadow hover:shadow-card active:cursor-grabbing"
    >
      <span className="inline-block rounded-xs bg-select px-2 py-0.5 text-sm text-ink-2">{p.name}</span>
      <div className={cx('mt-2.5 text-body', t.status === 'done' ? 'text-ink-2' : 'font-medium')}>{t.title}</div>
      {t.note && <div className="mt-1.5 text-sm text-ink-3">{t.note}</div>}
      <div className="mt-3 flex items-center gap-2">
        {t.status === 'done' ? (
          <span className="flex items-center gap-1.5 text-sm text-ink-2"><CheckCircle2 size={15} className="text-ink" /> {t.due}</span>
        ) : (
          <span className={cx('flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-sm', today ? 'border-ink text-ink' : 'border-hair-strong text-ink-2')}>
            <Calendar size={13} /> {t.due}
          </span>
        )}
        <span className="flex-1" />
        <span className="flex size-6 items-center justify-center rounded-full bg-select text-[10px] font-medium">{t.owner}</span>
      </div>
    </motion.div>
  )
}

function TaskDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTask, toast } = useStore()
  const navigate = useNavigate()
  return (
    <Drawer open={!!task} onClose={onClose} width={440} label="Task">
      {task && (
        <>
          <div className="flex items-start justify-between border-b border-hair px-6 py-5">
            <div>
              <div className="text-label text-ink-2">Task</div>
              <h2 className="mt-1 text-sub">{task.title}</h2>
            </div>
            <button aria-label="Close" onClick={onClose} className="rounded-xs p-1 text-ink-2 hover:bg-select"><X size={18} /></button>
          </div>
          <div className="flex flex-col gap-5 p-6">
            <Field label="Status">
              <div className="grid grid-cols-2 gap-2">
                {cols.map((c) => (
                  <button
                    key={c.v}
                    onClick={() => { updateTask(task.id, { status: c.v, due: c.v === 'done' ? 'Done today' : task.due.startsWith('Done') ? 'Today' : task.due }); toast(`Moved to ${c.label}`) }}
                    className={cx('flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors', task.status === c.v ? 'border-ink font-medium' : 'border-hair hover:border-hair-strong')}
                  >
                    <c.icon size={15} className="text-ink-2" /> {c.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Due">
              <select value={task.due} onChange={(e) => updateTask(task.id, { due: e.target.value })} className="field">
                {[task.due, 'Today', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20', 'Tue 24'].filter((v, i, a) => a.indexOf(v) === i).map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Owner">
              <select value={task.owner} onChange={(e) => updateTask(task.id, { owner: e.target.value })} className="field">
                {Object.entries(owners).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Note">
              <textarea value={task.note ?? ''} onChange={(e) => updateTask(task.id, { note: e.target.value })} rows={3} placeholder="Add a note for the team" className="field h-auto resize-none py-2.5" />
            </Field>
            <button onClick={() => { onClose(); navigate(`/patients/${task.patientId}`) }} className="flex items-center gap-3 rounded-lg border border-hair p-3 text-left hover:border-hair-strong">
              <Avatar initials={patientById(task.patientId).initials} />
              <span className="flex-1"><span className="block text-sm font-medium">{patientById(task.patientId).name}</span><span className="block text-cap text-ink-3">Open patient record</span></span>
            </button>
          </div>
        </>
      )}
    </Drawer>
  )
}

export default function Tasks() {
  const { tasks, moveTask, open, toast } = useStore()
  const [view, setView] = useState<'list' | 'board'>('board')
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<TaskStatus | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'due' | 'patient' | 'status'>('due')
  const selTask = tasks.find((t) => t.id === sel) ?? null
  const dueToday = tasks.filter((t) => t.due === 'Today' && t.status !== 'done').length
  const mine = tasks.filter((t) => t.owner === 'YO' && t.status !== 'done').length

  const drop = (status: TaskStatus) => {
    if (dragging) {
      const t = tasks.find((x) => x.id === dragging)
      if (t && t.status !== status) {
        moveTask(dragging, status)
        toast(`Moved “${t.title}” to ${cols.find((c) => c.v === status)!.label}`)
      }
    }
    setDragging(null)
    setOver(null)
  }
  const order = { todo: 0, progress: 1, waiting: 2, done: 3 }
  const listRows = [...tasks].sort((a, b) =>
    sortKey === 'patient' ? patientById(a.patientId).name.localeCompare(patientById(b.patientId).name) : sortKey === 'status' ? order[a.status] - order[b.status] : (a.due === 'Today' ? -1 : 0) - (b.due === 'Today' ? -1 : 0),
  )

  return (
    <Page crumbs={[{ label: 'Workspace' }, { label: 'Tasks' }]}>
      <Reveal className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-heading">Tasks</h1>
          <p className="mt-0.5 text-sm text-ink-2">{mine} for you, {tasks.length - mine} for your team · {dueToday} due today</p>
        </div>
        <div className="flex-1" />
        <Segmented id="taskview" value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} />
        <Button variant="primary" onClick={() => open('newTask')}>New task</Button>
      </Reveal>

      {view === 'board' ? (
          <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cols.map((c) => {
              const items = tasks.filter((t) => t.status === c.v)
              return (
                <div
                  key={c.v}
                  onDragOver={(e) => { e.preventDefault(); setOver(c.v) }}
                  onDragLeave={() => setOver((o) => (o === c.v ? null : o))}
                  onDrop={() => drop(c.v)}
                  className={cx('flex min-h-[520px] flex-col rounded-xl bg-select/80 p-3 transition-[box-shadow,background-color]', over === c.v && dragging && 'bg-wash ring-2 ring-primary/40')}
                >
                  <div className="flex items-center gap-2 px-2 pb-3 pt-1">
                    <c.icon size={16} className="text-ink-2" />
                    <span className="text-body font-medium">{c.label}</span>
                    <span className="font-mono text-mono text-ink-3">{items.length}</span>
                    <span className="flex-1" />
                    <button aria-label={`Add task to ${c.label}`} onClick={() => open('newTask', { status: c.v })} className="rounded-xs p-1 text-ink-2 hover:bg-canvas hover:text-ink"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <AnimatePresence initial={false}>
                      {items.map((t) => <TaskCard key={t.id} t={t} onOpen={() => setSel(t.id)} onDrag={setDragging} />)}
                    </AnimatePresence>
                    {items.length === 0 && <div className="rounded-lg border border-dashed border-hair-strong px-3 py-6 text-center text-sm text-ink-3">Drop a task here</div>}
                  </div>
                  {c.v === 'todo' && (
                    <button onClick={() => open('newTask')} className="mt-2 flex items-center gap-2 rounded-md px-2 py-2 text-body text-ink-2 hover:bg-canvas hover:text-ink">
                      <Plus size={16} /> Add task
                    </button>
                  )}
                </div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="overflow-hidden">
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-hair text-label text-ink-2">
                      <th className="w-10 px-5 py-3" />
                      <th className="px-3 py-3 font-medium">Task</th>
                      {(['patient', 'status', 'due'] as const).map((k) => (
                        <th key={k} className="px-3 py-3">
                          <button onClick={() => setSortKey(k)} className={cx('flex items-center gap-1 font-medium capitalize hover:text-ink', sortKey === k && 'text-ink')}>{k} <ArrowUpDown size={12} /></button>
                        </th>
                      ))}
                      <th className="px-3 py-3 font-medium">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listRows.map((t) => (
                      <motion.tr layout key={t.id} onClick={() => setSel(t.id)} className="cursor-pointer border-b border-hair last:border-0 hover:bg-select/50">
                        <td className="px-5 py-3">
                          <button
                            aria-label={t.status === 'done' ? 'Mark as to do' : 'Mark as done'}
                            onClick={(e) => { e.stopPropagation(); moveTask(t.id, t.status === 'done' ? 'todo' : 'done'); toast(t.status === 'done' ? 'Task reopened' : 'Task done') }}
                            className={cx('flex size-[18px] items-center justify-center rounded-full border transition-colors', t.status === 'done' ? 'border-ink bg-ink text-white' : 'border-hair-strong hover:border-ink')}
                          >
                            {t.status === 'done' && <CheckCircle2 size={18} />}
                          </button>
                        </td>
                        <td className={cx('px-3 py-3 text-body', t.status === 'done' ? 'text-ink-3 line-through' : 'font-medium')}>{t.title}</td>
                        <td className="px-3 py-3 text-body">{patientById(t.patientId).name}</td>
                        <td className="px-3 py-3 text-sm text-ink-2">{cols.find((c) => c.v === t.status)!.label}</td>
                        <td className={cx('px-3 py-3 font-mono text-mono', t.due === 'Today' ? 'text-ink' : 'text-ink-2')}>{t.due}</td>
                        <td className="px-3 py-3 text-sm text-ink-2">{owners[t.owner]}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      <TaskDrawer task={selTask} onClose={() => setSel(null)} />
    </Page>
  )
}
