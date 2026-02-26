import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PendingReview from './pages/PendingReview'
import AutoRejected from './pages/AutoRejected'
import ActiveCompleted from './pages/ActiveCompleted'
import { useLeads } from './hooks/useLeads'

export default function App() {
  const { leads: pendingLeads } = useLeads('pending')
  const { leads: rejectedLeads } = useLeads('auto_rejected')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        pendingCount={pendingLeads.length}
        rejectedCount={rejectedLeads.length}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-navy-100 px-6 h-[60px] flex items-center justify-end flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-navy-700">Admin</p>
              <p className="text-xs text-navy-400">admin@northstarwealth.ca</p>
            </div>
            <div className="w-9 h-9 bg-navy-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">A</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/pending" replace />} />
            <Route path="/pending" element={<PendingReview />} />
            <Route path="/rejected" element={<AutoRejected />} />
            <Route path="/active" element={<ActiveCompleted />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
