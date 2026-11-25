import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as data from './data/mock'
import type { CodingNote, Encounter, Role, Task, TaskStatus } from './data/mock'

export type Brand = 'green' | 'yellow' | 'blue'
export type Overlay = null | 'search' | 'notifications' | 'help' | 'account' | 'location' | 'newEncounter' | 'newTask' | 'message' | 'brief'

interface Toast {
  id: number
  text: string
  action?: { label: string; run: () => void }
}

interface Store {
  brand: Brand
  setBrand: (b: Brand) => void
  role: Role
  setRole: (r: Role) => void
  location: string
  setLocation: (l: string) => void
  firstRun: boolean
  setFirstRun: (v: boolean) => void
  tourStep: number
  setTourStep: (n: number) => void

  encounters: Encounter[]
  updateEncounter: (id: string, patch: Partial<Encounter>) => void
  addEncounter: (e: Encounter) => void
  notes: CodingNote[]
  addNote: (n: CodingNote) => void
  resolveNote: (id: string) => void

  tasks: Task[]
  addTask: (t: Omit<Task, 'id'>) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  moveTask: (id: string, status: TaskStatus) => void

  notifications: data.Notification[]
  markAllRead: () => void
  markRead: (id: string) => void

  overlay: Overlay
  overlayData: Record<string, unknown>
  open: (o: Overlay, d?: Record<string, unknown>) => void
  close: () => void

  toasts: Toast[]
  toast: (text: string, action?: Toast['action']) => void
  dismissToast: (id: number) => void

  reset: () => void
}

const Ctx = createContext<Store | null>(null)

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem('landmark:' + k)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem('landmark:' + k, JSON.stringify(v))
  } catch {
    /* storage can be unavailable in private windows */
  }
}

let toastId = 1

export function StoreProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<Brand>(() => read('brand', 'green'))
  const [role, setRole] = useState<Role>('provider')
  const [location, setLocation] = useState('Buffalo, NY')
  const [firstRun, setFirstRun] = useState(true)
  const [tourStep, setTourStep] = useState(-1)
  const [encounters, setEncounters] = useState(data.encounters)
  const [notes, setNotes] = useState(data.codingNotes)
  const [tasks, setTasks] = useState(data.tasks)
  const [notifications, setNotifications] = useState(data.notifications)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [overlayData, setOverlayData] = useState<Record<string, unknown>>({})
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    document.documentElement.dataset.brand = brand
    write('brand', brand)
  }, [brand])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (text: string, action?: Toast['action']) => {
      const id = toastId++
      setToasts((t) => [...t.slice(-2), { id, text, action }])
      setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const store = useMemo<Store>(
    () => ({
      brand,
      setBrand: setBrandState,
      role,
      setRole,
      location,
      setLocation,
      firstRun,
      setFirstRun,
      tourStep,
      setTourStep,
      encounters,
      updateEncounter: (id, patch) => setEncounters((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      addEncounter: (e) => setEncounters((es) => [e, ...es]),
      notes,
      addNote: (n) => setNotes((ns) => [...ns, n]),
      resolveNote: (id) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, resolved: true } : n))),
      tasks,
      addTask: (t) => {
        const task = { ...t, id: 't' + Date.now() + Math.random().toString(16).slice(2, 5) }
        setTasks((ts) => [task, ...ts])
        return task
      },
      updateTask: (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      moveTask: (id, status) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t))),
      notifications,
      markAllRead: () => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false }))),
      markRead: (id) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n))),
      overlay,
      overlayData,
      open: (o, d = {}) => {
        setOverlayData(d)
        setOverlay(o)
      },
      close: () => setOverlay(null),
      toasts,
      toast,
      dismissToast,
      reset: () => {
        setEncounters(data.encounters)
        setNotes(data.codingNotes)
        setTasks(data.tasks)
        setNotifications(data.notifications)
        setFirstRun(true)
        setTourStep(-1)
        setRole('provider')
        setOverlay(null)
      },
    }),
    [brand, role, location, firstRun, tourStep, encounters, notes, tasks, notifications, overlay, overlayData, toasts, toast, dismissToast],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}

export const statusMeta: Record<Encounter['status'], { label: string; rag: data.Rag }> = {
  open: { label: 'Open', rag: 'amber' },
  returned: { label: 'Returned by coding', rag: 'red' },
  ready: { label: 'Ready for coding', rag: 'green' },
  coded: { label: 'Coded', rag: 'grey' },
}

export const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
