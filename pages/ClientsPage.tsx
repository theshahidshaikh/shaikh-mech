
import React, { useState } from 'react';
import { Client, PulleyItem, AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Trash2, Edit2, ChevronRight, User, IndianRupee } from 'lucide-react';

interface ClientsPageProps {
  clients: Client[];
  items: PulleyItem[];
  settings: AppSettings;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientForView: (clientId: string) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ clients, items, settings, onAddClient, onUpdateClient, onDeleteClient, onSelectClientForView }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientRate, setNewClientRate] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    if (editingClient) {
        onUpdateClient({
            ...editingClient,
            name: newClientName,
            contact: newClientContact,
            defaultRate: newClientRate ? parseFloat(newClientRate) : undefined
        });
    } else {
        onAddClient({
            id: Math.random().toString(36).substr(2, 9),
            name: newClientName,
            contact: newClientContact,
            defaultRate: newClientRate ? parseFloat(newClientRate) : undefined
        });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientContact('');
    setNewClientRate('');
    setEditingClient(null);
    setShowAddForm(false);
  };

  const handleEditClick = (client: Client) => {
      setEditingClient(client);
      setNewClientName(client.name);
      setNewClientContact(client.contact || '');
      setNewClientRate(client.defaultRate ? client.defaultRate.toString() : '');
      setShowAddForm(true);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.contact && c.contact.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button onClick={() => {
            if (showAddForm && !editingClient) {
                setShowAddForm(false);
            } else {
                resetForm();
                setShowAddForm(true);
            }
        }} size="sm">
          {showAddForm && !editingClient ? 'Cancel' : 'Add Client'}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <Input 
              label="Client Name" 
              value={newClientName} 
              onChange={e => setNewClientName(e.target.value)} 
              placeholder="Company Name"
              required
            />
            <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Contact Person" 
                  value={newClientContact} 
                  onChange={e => setNewClientContact(e.target.value)} 
                  placeholder="Name (Optional)"
                />
                <Input 
                  label="Fixed Rate (Optional)" 
                  type="number"
                  step="0.01"
                  value={newClientRate} 
                  onChange={e => setNewClientRate(e.target.value)} 
                  placeholder="e.g. 5.5"
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingClient ? 'Update Client' : 'Save Client'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
         <input 
            type="text" 
            placeholder="Search clients..." 
            className="pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500 w-full shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No clients found.</p>
                <Button variant="ghost" onClick={() => { resetForm(); setShowAddForm(true); }} className="mt-2 text-brand-600">Add your first client</Button>
            </div>
        ) : (
            filteredClients.map(client => {
                // Calculate quick stats
                const clientItems = items.filter(i => i.clientId === client.id);
                const lastActivity = clientItems.length > 0 
                    ? clientItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
                    : 'No activity';
                const totalBilled = clientItems
                    .filter(i => i.transactionType === 'OUT')
                    .reduce((acc, curr) => acc + curr.total, 0);

                return (
                    <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 active:scale-[0.99] transition-transform">
                        <div className="flex justify-between items-start">
                             <div className="flex items-start gap-3">
                                 <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                                     {client.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-gray-900">{client.name}</h3>
                                     <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <User size={12} /> {client.contact || 'No contact'}
                                     </p>
                                 </div>
                             </div>
                             <div className="flex gap-1">
                                <button 
                                    onClick={() => handleEditClick(client)}
                                    className="p-2 text-gray-400 hover:text-brand-600 rounded-full hover:bg-brand-50"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => onDeleteClient(client.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 mt-1 text-center sm:text-left">
                             <div>
                                 <p className="text-xs text-gray-400">Total Billed</p>
                                 <p className="font-semibold text-gray-700">{settings.currency}{totalBilled.toLocaleString()}</p>
                             </div>
                             <div>
                                 <p className="text-xs text-gray-400">Fixed Rate</p>
                                 <p className="font-semibold text-gray-700 flex items-center justify-center sm:justify-start gap-1">
                                    {client.defaultRate ? <><IndianRupee size={12}/>{client.defaultRate}</> : '-'}
                                 </p>
                             </div>
                             <div>
                                 <p className="text-xs text-gray-400">Last Activity</p>
                                 <p className="font-semibold text-gray-700">{lastActivity}</p>
                             </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="flex-1 text-xs" 
                                onClick={() => onSelectClientForView(client.id)}
                            >
                                View Dashboard
                            </Button>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
