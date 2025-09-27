import { useAuth } from './hooks/useAuth'
import AuthForm from './components/Auth/AuthForm'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import Customers from './components/Customers/Customers'
import { useState } from 'react'

function App() {
  const { user, loading } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return <Customers />
      case 'orders':
        return <div className="p-6">Orders - Coming Soon</div>
      case 'invoices':
        return <div className="p-6">Invoices - Coming Soon</div>
      case 'finances':
        return <div className="p-6">Finances - Coming Soon</div>
      case 'reports':
        return <div className="p-6">Reports - Coming Soon</div>
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 overflow-auto lg:ml-0">
        {renderContent()}
      </div>
    </div>
  )
}

export default App