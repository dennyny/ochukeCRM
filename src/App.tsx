import { useAuth } from './hooks/useAuth';
import AuthForm from './components/Auth/AuthForm';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Customers from './components/Customers/Customers';
import Orders from './components/Orders/Orders';
import Invoices from './components/Invoices/Invoices';
import Finances from './components/Finances/Finances';
import Reports from './components/Reports/Reports';
import LandingPage from './components/LandingPage/LandingPage';
import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'orders':
        return <Orders />;
      case 'invoices':
        return <Invoices />;
      case 'finances':
        return <Finances />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <AuthForm />} />
      <Route path="/" element={user ? (
        <div className="flex h-screen bg-gray-50">
          <Sidebar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <div className="flex-1 overflow-auto lg:ml-0">
            {renderContent()}
          </div>
        </div>
      ) : <LandingPage />} />
    </Routes>
  );
}

export default App;
