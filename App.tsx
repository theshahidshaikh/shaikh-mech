
import React, { useState, useEffect } from 'react';
import { ViewState, PulleyItem, AppSettings, Client } from './types';
import { Navbar } from './components/Navbar';
import { LoginSignupPage } from './pages/LoginSignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddItemsPage } from './pages/AddItemsPage';
import { TallyPage } from './pages/TallyPage';
import { BillingPage } from './pages/BillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClientsPage } from './pages/ClientsPage';
import { api } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // App State
  const [settings, setSettings] = useState<AppSettings>({
    companyName: '',
    companyAddress: '',
    gstNo: '',
    defaultRate: 6,
    boreRate: 50,
    currency: '' // Removed currency symbol
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<PulleyItem[]>([]);

  // Initial Data Load on Auth
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
        const [fetchedItems, fetchedClients] = await Promise.all([
            api.getItems(),
            api.getClients()
        ]);
        setItems(fetchedItems);
        setClients(fetchedClients);
    } catch (e) {
        console.error("Failed to load data", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async (user: any, userSettings: AppSettings) => {
    setSettings(userSettings);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView('dashboard');
    setItems([]);
    setClients([]);
  };

  const handleAddItem = async (newItem: PulleyItem) => {
    // Optimistic Update (update UI immediately) or Wait for Server
    // Here we wait for server to ensure ID sync
    try {
       await api.saveItem(newItem);
       // Reload items to get fresh state (or just append locally if you prefer speed)
       const freshItems = await api.getItems();
       setItems(freshItems);
    } catch(e) {
        alert("Failed to save item");
    }
  };

  const handleUpdateItem = async (updatedItem: PulleyItem) => {
    try {
        await api.saveItem(updatedItem); // Upsert logic in mock/api
        const freshItems = await api.getItems();
        setItems(freshItems);
    } catch (e) {
        alert("Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
        await api.deleteItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
        alert("Failed to delete");
    }
  };

  const handleAddClient = async (client: Client) => {
    try {
        await api.saveClient(client);
        setClients(prev => [...prev, client]);
    } catch (e) {
        alert("Failed to save client");
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
      try {
          await api.updateClient(updatedClient);
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      } catch (e) {
          alert("Failed to update client");
      }
  };

  const handleDeleteClient = async (id: string) => {
    try {
        await api.deleteClient(id);
        setClients(prev => prev.filter(c => c.id !== id));
    } catch (e) {
        alert("Failed to delete client");
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
      try {
          await api.saveSettings(newSettings);
          setSettings(newSettings);
      } catch (e) {
          alert("Failed to save settings");
      }
  };

  const handleSelectClientForView = (clientId: string) => {
    setView('dashboard');
    // Ideally pass a filter param to dashboard, but for now simple nav
  };

  if (!isAuthenticated) {
    return <LoginSignupPage onLoginSuccess={handleLogin} />;
  }

  if (isLoading && items.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar 
        currentView={view} 
        onChangeView={setView} 
        onLogout={handleLogout} 
        userCompany={settings.companyName} 
      />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-8 print:p-0 print:m-0 print:max-w-none print:overflow-visible print:h-auto">
        {view === 'dashboard' && <DashboardPage items={items} clients={clients} settings={settings} />}
        {view === 'add-items' && (
          <AddItemsPage 
            items={items} 
            clients={clients}
            settings={settings} 
            onAddItem={handleAddItem} 
            onUpdateItem={handleUpdateItem} 
            onDeleteItem={handleDeleteItem}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
        {view === 'tally' && <TallyPage items={items} clients={clients} settings={settings} />}
        {view === 'billing' && <BillingPage items={items} settings={settings} clients={clients} />}
        {view === 'clients' && (
           <ClientsPage 
             clients={clients} 
             items={items}
             settings={settings}
             onAddClient={handleAddClient}
             onUpdateClient={handleUpdateClient}
             onDeleteClient={handleDeleteClient}
             onSelectClientForView={handleSelectClientForView}
           />
        )}
        {view === 'settings' && (
          <SettingsPage 
            settings={settings} 
            onUpdateSettings={handleUpdateSettings} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
