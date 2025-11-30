
import React from 'react';
import { PulleyItem, Client, AppSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Users, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardPageProps {
  items: PulleyItem[];
  clients: Client[];
  settings: AppSettings;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ items, clients, settings }) => {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedClientId, setSelectedClientId] = React.useState<string>('all');

  // Filter items by month and optionally by client
  const filteredItems = items.filter(item => {
    const matchesMonth = item.date.startsWith(selectedMonth);
    const matchesClient = selectedClientId === 'all' || item.clientId === selectedClientId;
    return matchesMonth && matchesClient;
  });

  // Calculate stats
  const totalSent = filteredItems
    .filter(i => i.transactionType === 'OUT')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const totalReceived = filteredItems
    .filter(i => i.transactionType === 'IN')
    .reduce((acc, curr) => acc + curr.quantity, 0);
  
  const totalAmount = filteredItems
    .filter(i => i.transactionType === 'OUT')
    .reduce((acc, curr) => acc + curr.total, 0);

  // Group by pulley string to find most/least sold
  const itemCounts = filteredItems
    .filter(i => i.transactionType === 'OUT')
    .reduce((acc: Record<string, number>, item) => {
        acc[item.pulleyString] = (acc[item.pulleyString] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

  const sortedItems = Object.entries(itemCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
  
  const mostSoldItem = sortedItems.length > 0 ? { name: sortedItems[0][0], count: sortedItems[0][1] } : null;
  const leastSoldItem = sortedItems.length > 0 ? { name: sortedItems[sortedItems.length - 1][0], count: sortedItems[sortedItems.length - 1][1] } : null;

  // Prepare chart data (Daily breakdown for the selected month)
  const getDaysInMonth = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-').map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const chartData = getDaysInMonth(selectedMonth).map(day => {
    const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
    const dayItems = filteredItems.filter(i => i.date === dateStr);
    return {
      name: day.toString(),
      Sent: dayItems.filter(i => i.transactionType === 'OUT').reduce((a, c) => a + c.quantity, 0),
      Received: dayItems.filter(i => i.transactionType === 'IN').reduce((a, c) => a + c.quantity, 0),
    };
  });

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between h-full">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 mr-4`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sm:bg-transparent sm:p-0 sm:border-none sm:shadow-none">
        <div className="flex justify-between items-end">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back</p>
             </div>
        </div>
        
        {/* Filters - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1 relative bg-gray-50 rounded-lg p-2 border border-gray-200">
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-1 flex items-center gap-1"><Calendar size={10}/> Month</div>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-700 focus:ring-0"
                />
            </div>
            
            <div className="col-span-1 relative bg-gray-50 rounded-lg p-2 border border-gray-200">
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-1 flex items-center gap-1"><Users size={10}/> Client</div>
                <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-700 focus:ring-0"
                >
                    <option value="all">All Clients</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Billed"
          value={totalSent}
          subValue={selectedClientId !== 'all' ? `To ${clients.find(c=>c.id === selectedClientId)?.name}` : "All Clients"}
          icon={ArrowUpRight}
          color="bg-green-500 text-green-600"
        />
        <StatCard
          title="Total Received"
          value={totalReceived}
          subValue="Stock In"
          icon={ArrowDownRight}
          color="bg-blue-500 text-blue-600"
        />
        <StatCard
          title="Revenue (Est.)"
          value={`${settings.currency}${totalAmount.toLocaleString()}`}
          subValue="Based on outgoing"
          icon={IndianRupee}
          color="bg-indigo-500 text-indigo-600"
        />
      </div>

      {/* Most/Least Sold Stats */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-green-500 w-4 h-4" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Most Sold Item</h3>
              </div>
              {mostSoldItem ? (
                  <div>
                      <p className="text-lg font-bold text-gray-900">{mostSoldItem.name}</p>
                      <p className="text-xs text-gray-400">{mostSoldItem.count} units</p>
                  </div>
              ) : (
                  <p className="text-sm text-gray-400 italic">No sales yet</p>
              )}
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="text-orange-500 w-4 h-4" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Least Sold Item</h3>
              </div>
              {leastSoldItem ? (
                  <div>
                      <p className="text-lg font-bold text-gray-900">{leastSoldItem.name}</p>
                      <p className="text-xs text-gray-400">{leastSoldItem.count} units</p>
                  </div>
              ) : (
                  <p className="text-sm text-gray-400 italic">No sales yet</p>
              )}
          </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Trend</h3>
        <div className="h-60 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <Bar dataKey="Received" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Sent" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};