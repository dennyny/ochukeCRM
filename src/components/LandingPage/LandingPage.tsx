import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Users, ShoppingCart, FileText, DollarSign, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">Ochuke Ltd</div>
          <nav className="space-x-6">
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-blue-50">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">Your Business, Simplified</h1>
          <p className="text-xl text-gray-600 mb-8">Ochuke CRM helps you manage your customers, orders, and finances in one place.</p>
          <Link to="/login" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors">Get Started <ArrowRight className="inline-block ml-2" /></Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 inline-block mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Customer Management</h3>
              <p className="text-gray-600">Keep track of all your customers and their information.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 inline-block mb-4">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Order Tracking</h3>
              <p className="text-gray-600">Manage your orders and keep track of their status.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 inline-block mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Invoicing</h3>
              <p className="text-gray-600">Create and send invoices to your customers with ease.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 inline-block mb-4">
                <DollarSign size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Financial Tracking</h3>
              <p className="text-gray-600">Keep track of your income and expenses.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 inline-block mb-4">
                <BarChart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Reports</h3>
              <p className="text-gray-600">Generate reports to get insights into your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 Ochuke Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;