
import React, { useState } from 'react';
import { PulleyItem, Client, AppSettings } from '../types';
import { Input } from '../components/ui/Input';
import { Search, Users } from 'lucide-react';

interface TallyPageProps {
  items: PulleyItem[];
  clients: Client[];
  settings: AppSettings;
}

interface TallyRowData {
  name: string;
  receivedQty: number;
  sentQty: number;
  receivedVal: number;
  sentVal: number;
  section: string;
  diameter: number;
}

export const TallyPage: React.FC<TallyPageProps> = ({ items, clients, settings }) => {
  // Initialize with current month
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // 1. Group by Pulley String
  const groupedData = items.reduce((acc: Record<string, TallyRowData>, item) => {
    // Filters
    if (filterMonth && !item.date.startsWith(filterMonth)) return acc;
    if (searchTerm && !item.pulleyString.includes(searchTerm)) return acc;
    if (selectedClientId !== 'all' && item.clientId !== selectedClientId) return acc;

    if (!acc[item.pulleyString]) {
      acc[item.pulleyString] = {
        name: item.pulleyString,
        receivedQty: 0,
        sentQty: 0,
        receivedVal: 0,
        sentVal: 0,
        section: item.section,
        diameter: item.diameter // for sorting
      };
    }
    
    if (item.transactionType === 'IN') {
        acc[item.pulleyString].receivedQty += item.quantity;
        acc[item.pulleyString].receivedVal += item.total;
    } else {
        acc[item.pulleyString].sentQty += item.quantity;
        acc[item.pulleyString].sentVal += item.total;
    }
    
    return acc;
  }, {} as Record<string, TallyRowData>);

  const tableRows = Object.values(groupedData)
    .map((row: TallyRowData) => ({ 
        ...row, 
        netQty: row.receivedQty - row.sentQty,
        diffVal: row.sentVal - row.receivedVal 
    }))
    .sort((a, b) => {
        // Sort by Section then Diameter
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        return a.diameter - b.diameter;
    });

  // Calculate totals for footer
  const totalInQty = tableRows.reduce((acc, row) => acc + row.receivedQty, 0);
  const totalOutQty = tableRows.reduce((acc, row) => acc + row.sentQty, 0);
  const totalInVal = tableRows.reduce((acc, row) => acc + row.receivedVal, 0);
  const totalOutVal = tableRows.reduce((acc, row) => acc + row.sentVal, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Stock & Value Tally</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
             {/* Search */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search Spec..." 
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-500 focus:border-brand-500 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             {/* Client Filter */}
             <div className="relative">
                 <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-500 focus:border-brand-500 w-full"
                 >
                    <option value="all">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
             </div>

             {/* Month Filter */}
             <input
                type="month"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500 w-full"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
             />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Pulley Spec</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qty In</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qty Out</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100">Qty Net</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider text-blue-600">Amt In</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider text-green-600">Amt Out</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100">Diff</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {tableRows.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No data found for the selected criteria.</td>
                        </tr>
                    ) : (
                        tableRows.map((row) => (
                            <tr key={row.name} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-white border-r border-gray-100">{row.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{row.receivedQty}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{row.sentQty}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right bg-gray-50 ${row.netQty < 0 ? 'text-red-600' : 'text-gray-900'}`}>{row.netQty}</td>
                                
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-right font-medium">{settings.currency}{row.receivedVal.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 text-right font-medium">{settings.currency}{row.sentVal.toLocaleString()}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right bg-gray-50 ${row.diffVal < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {settings.currency}{row.diffVal.toLocaleString()}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full ${row.netQty > 0 ? 'bg-green-100 text-green-800' : row.netQty < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {row.netQty > 0 ? 'Stock' : row.netQty < 0 ? 'Deficit' : 'Empty'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                {tableRows.length > 0 && (
                    <tfoot className="bg-gray-100 font-bold text-xs uppercase text-gray-700">
                        <tr>
                            <td className="px-4 py-3 sticky left-0 bg-gray-100 border-r border-gray-200">Totals</td>
                            <td className="px-4 py-3 text-right">{totalInQty}</td>
                            <td className="px-4 py-3 text-right">{totalOutQty}</td>
                            <td className="px-4 py-3 text-right">{totalInQty - totalOutQty}</td>
                            <td className="px-4 py-3 text-right text-blue-700">{settings.currency}{totalInVal.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-green-700">{settings.currency}{totalOutVal.toLocaleString()}</td>
                            <td className={`px-4 py-3 text-right ${(totalOutVal - totalInVal) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {settings.currency}{(totalOutVal - totalInVal).toLocaleString()}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
      </div>
    </div>
  );
};
