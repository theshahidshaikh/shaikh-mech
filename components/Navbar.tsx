
import React from 'react';
import { LayoutDashboard, PlusCircle, Calculator, FileText, Settings, LogOut, Users, Menu } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  userCompany: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, onLogout, userCompany }) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={22} /> },
    { id: 'tally', label: 'Tally', icon: <Calculator size={22} /> },
    { id: 'add-items', label: 'Add', icon: <PlusCircle size={32} /> }, // Larger icon for central action
    { id: 'billing', label: 'Bill', icon: <FileText size={22} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={22} /> },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-2">
                  S
                </div>
                <span className="font-bold text-xl text-gray-800">ShaikhMech</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeView(item.id)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors ${
                      currentView === item.id
                        ? 'border-brand-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.id === 'add-items' ? <PlusCircle size={18}/> : item.icon}</span>
                    {item.label}
                  </button>
                ))}
                {/* Desktop Settings Link */}
                <button
                    onClick={() => onChangeView('settings')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors ${
                      currentView === 'settings'
                        ? 'border-brand-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2"><Settings size={18}/></span>
                    Settings
                  </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-4 font-medium">{userCompany}</span>
              <button
                onClick={onLogout}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <div className="sm:hidden bg-white border-b border-gray-200 sticky top-0 z-40 px-4 h-14 flex items-center justify-between shadow-sm print:hidden">
         <div className="flex items-center">
            <div className="h-7 w-7 bg-brand-600 rounded-md flex items-center justify-center text-white font-bold text-sm mr-2">
              S
            </div>
            <span className="font-bold text-lg text-gray-800 truncate max-w-[150px]">{userCompany}</span>
         </div>
         <div className="flex gap-2">
             <button onClick={() => onChangeView('settings')} className={`p-2 rounded-full ${currentView === 'settings' ? 'text-brand-600 bg-brand-50' : 'text-gray-500'}`}>
                <Settings size={20} />
             </button>
             <button onClick={onLogout} className="p-2 rounded-full text-gray-400">
                <LogOut size={20} />
             </button>
         </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-end h-[60px] pb-1 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full pb-1 transition-colors ${
              currentView === item.id 
                ? 'text-brand-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`transition-transform duration-200 ${currentView === item.id ? 'transform -translate-y-1' : ''} ${item.id === 'add-items' ? 'text-brand-600' : ''}`}>
                {item.icon}
            </div>
            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};