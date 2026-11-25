import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { DemoDock, Overlays } from './components/Overlays'
import { Sidebar } from './components/Shell'
import { Toasts } from './components/ui'
import { ChooseRole, SignIn, Verify } from './pages/Auth'
import CalendarPage from './pages/Calendar'
import CareGaps from './pages/CareGaps'
import CodingReview from './pages/CodingReview'
import EncounterPage, { DraftReview } from './pages/Encounter'
import HomePage from './pages/Home'
import { Metrics, Settings } from './pages/Metrics'
import PatientRecord from './pages/PatientRecord'
import Tasks from './pages/Tasks'
import { StoreProvider } from './store'

function AppShell() {
  return (
    <div className="flex h-full">
      <div className="hidden h-full lg:block">
        <Sidebar />
      </div>
      <Outlet />
      <Overlays />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/role" element={<ChooseRole />} />
          <Route element={<AppShell />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/patients" element={<CareGaps />} />
            <Route path="/patients/:id" element={<PatientRecord />} />
            <Route path="/encounter/:id" element={<EncounterPage />} />
            <Route path="/encounter/:id/draft" element={<DraftReview />} />
            <Route path="/coding" element={<CodingReview />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <DemoDock />
        <Toasts />
      </HashRouter>
    </StoreProvider>
  )
}
