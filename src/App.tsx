import { useState } from 'react'
import './App.css'
import { Dashboard } from './modules/dashboard/Dashboard'
import { HRModule } from './modules/hr/HRModule'
import { MachineModule } from './modules/machine/MachineModule'
import { VisitorModule } from './modules/visitor/VisitorModule'

function App() {
  const [activeModule, setActiveModule] = useState('dashboard')

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-label">Avyren ERP</div>
          <h1>Avy-ERP</h1>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            📊 Dashboard
          </button>

          <div className="brand-label" style={{ marginTop: '16px', fontSize: '9px' }}>Modules</div>

          <button
            className={`nav-item ${activeModule === 'hr' ? 'active-hr' : ''}`}
            onClick={() => setActiveModule('hr')}
          >
            👥 HR Management
          </button>
          <button
            className={`nav-item ${activeModule === 'machine' ? 'active-mach' : ''}`}
            onClick={() => setActiveModule('machine')}
          >
            ⚙️ Machine Config
          </button>
          <button
            className={`nav-item ${activeModule === 'visitor' ? 'active-vis' : ''}`}
            onClick={() => setActiveModule('visitor')}
          >
            🚪 Visitor Board
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-title">
            {activeModule === 'dashboard' && 'Dashboard Overview'}
            {activeModule === 'hr' && 'HR Management'}
            {activeModule === 'machine' && 'Machine Master & PM'}
            {activeModule === 'visitor' && 'Visitor Logistics'}
          </div>
        </header>

        <section className="content-area">
          {activeModule === 'dashboard' && <Dashboard />}
          {activeModule === 'hr' && <HRModule />}
          {activeModule === 'machine' && <MachineModule />}
          {activeModule === 'visitor' && <VisitorModule />}
        </section>
      </main>
    </div>
  )
}

export default App

