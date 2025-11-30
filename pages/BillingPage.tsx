
import React, { useState } from 'react';
import { PulleyItem, AppSettings, Client } from '../types';
import { Button } from '../components/ui/Button';
import { Printer, Users, FileSpreadsheet, Download } from 'lucide-react';

interface BillingPageProps {
  items: PulleyItem[];
  clients: Client[];
  settings: AppSettings;
}

export const BillingPage: React.FC<BillingPageProps> = ({ items, clients, settings }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Filter only OUT transactions (Billing) for selected Client and Month
  const billingItems = items.filter(
    item => 
        item.transactionType === 'OUT' && 
        item.date.startsWith(selectedMonth) &&
        (selectedClientId ? item.clientId === selectedClientId : true)
  ).sort((a,b) => a.date.localeCompare(b.date));

  const totalAmount = billingItems.reduce((acc, item) => acc + item.total, 0);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Generate Invoice Number for display and filename
  const invoiceNumber = `INV-${selectedMonth.replace('-','')}-${selectedClient ? selectedClient.name.substring(0,3).toUpperCase() : 'ALL'}`;

  const handleExportExcel = () => {
    // Columns: Type, Pulley, Total Units, Cost/Unit, M/C Cost
    const headers = ['Type', 'Pulley', 'Total Units', 'Cost/Unit', 'M/C Cost'];
    
    const csvContent = [
      headers.join(','),
      ...billingItems.map(item => {
        const effectiveRate = item.quantity > 0 ? (item.total / item.quantity) : 0;
        return [
          item.type,
          `"${item.pulleyString}"`,
          item.quantity,
          effectiveRate.toFixed(2),
          item.total.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Statement_${selectedClient?.name || 'All'}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    // Change title for PDF filename
    const originalTitle = document.title;
    document.title = invoiceNumber;
    window.print();
    // Restore title
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-content');
    
    // Temporarily remove overflow-x-auto to ensure the full table is captured in the PDF
    // This fixes the issue where the table is cut off on mobile devices during PDF generation
    const tableContainer = element?.querySelector('.overflow-x-auto');
    if (tableContainer) {
        tableContainer.classList.remove('overflow-x-auto');
    }

    const opt = {
      margin: 5,
      filename: `${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
             // Restore scrollable table after generation
             if (tableContainer) {
                tableContainer.classList.add('overflow-x-auto');
            }
        });
    } else {
        alert("PDF generator is loading... please try again in a few seconds.");
        if (tableContainer) {
            tableContainer.classList.add('overflow-x-auto');
        }
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on Print) */}
      <div className="flex flex-col gap-4 no-print">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Bill Statement</h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-100 p-4 rounded-lg">
            <div className="w-full md:w-auto">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Client</label>
                <div className="flex items-center bg-white rounded-md border border-gray-300 px-2">
                    <Users size={16} className="text-gray-400 mr-2" />
                    <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full md:w-48 border-none focus:ring-0 text-sm py-2"
                    >
                        <option value="">-- All Clients --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="w-full md:w-auto">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Month</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                />
            </div>
            
            <div className="mt-auto md:ml-auto flex flex-wrap gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={handleExportExcel} disabled={billingItems.length === 0} className="flex-1 md:flex-none">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </Button>
                <Button type="button" variant="secondary" onClick={handleDownloadPDF} disabled={billingItems.length === 0} className="flex-1 md:flex-none">
                    <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button type="button" variant="secondary" onClick={handlePrint} disabled={billingItems.length === 0} className="flex-1 md:flex-none">
                    <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
            </div>
        </div>
      </div>

      {/* Invoice Layout (Optimized for Screen & Print) */}
      <div id="invoice-content" className="bg-white p-4 sm:p-10 rounded-sm shadow-lg border border-gray-200 print:shadow-none print:border-none print:w-full print:p-0 print:m-0 invoice-container">
        
        {/* Formal Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-800 pb-4 mb-6 gap-4">
            <div className="flex gap-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-900 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl rounded print:bg-black print:text-white shrink-0">
                    {settings.companyName.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase tracking-wide">{settings.companyName}</h2>
                    {settings.companyAddress && (
                        <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-wrap max-w-xs">{settings.companyAddress}</p>
                    )}
                    {settings.gstNo && (
                        <p className="text-gray-600 text-xs sm:text-sm mt-1 font-semibold">GST/TAX: {settings.gstNo}</p>
                    )}
                </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-300 uppercase tracking-widest print:text-gray-400">Invoice</h1>
                <div className="mt-2 sm:mt-4 text-sm">
                    <p><span className="font-bold text-gray-700">Date:</span> {new Date().toLocaleDateString()}</p>
                    <p><span className="font-bold text-gray-700">Month:</span> {selectedMonth}</p>
                    <p><span className="font-bold text-gray-700">Invoice #:</span> {invoiceNumber}</p>
                </div>
            </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8 p-4 bg-gray-50 rounded print:bg-transparent print:border print:border-gray-300 print:p-2">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bill To:</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{selectedClient ? selectedClient.name : 'General Account / All Clients'}</h3>
            {selectedClient?.contact && <p className="text-gray-700">Attn: {selectedClient.contact}</p>}
        </div>

        {/* Invoice Table Container - Allows scroll on mobile without breaking layout */}
        <div className="overflow-x-auto border border-gray-300 print:border-0 print:overflow-visible">
            <table className="min-w-full divide-y divide-gray-300 text-left">
                <thead className="bg-gray-100 print:bg-gray-200">
                    <tr>
                        <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase border-r border-gray-300 whitespace-nowrap">Date</th>
                        <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase border-r border-gray-300 w-1/2 min-w-[200px]">Description</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-300">Qty</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase border-r border-gray-300 whitespace-nowrap">Rate</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase whitespace-nowrap">Amount</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {billingItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No billable items found.</td></tr>
                    ) : (
                        billingItems.map((item, idx) => (
                            <tr key={item.id} className="print:border-b print:border-gray-300">
                                <td className="px-3 py-2 text-sm text-gray-800 whitespace-nowrap border-r border-gray-300">{item.date.slice(5)}</td>
                                <td className="px-3 py-2 text-sm text-gray-800 border-r border-gray-300">
                                    <div className="font-semibold">{item.pulleyString} <span className="text-gray-500 text-xs">({item.type})</span></div>
                                    {!selectedClientId && <div className="text-xs text-gray-500 italic">{item.clientName}</div>}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-800 text-center border-r border-gray-300">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-gray-800 text-right border-r border-gray-300">{item.costPerUnit.toFixed(2)}</td>
                                <td className="px-3 py-2 text-sm text-gray-800 text-right font-medium">{item.total.toFixed(2)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-800">
                    <tr>
                        <td colSpan={2} className="px-3 py-3 text-right font-bold text-gray-900 border-r border-gray-300">Totals:</td>
                        <td className="px-3 py-3 text-center font-bold text-gray-900 border-r border-gray-300">{billingItems.reduce((a,c) => a+c.quantity, 0)}</td>
                        <td className="border-r border-gray-300"></td>
                        <td className="px-3 py-3 text-right font-bold text-gray-900 text-lg whitespace-nowrap">{settings.currency}{totalAmount.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {/* Footer & Signature */}
        <div className="mt-12 flex flex-col sm:flex-row justify-between items-end gap-10 break-inside-avoid">
            <div className="text-sm text-gray-500 max-w-md w-full sm:w-auto">
                <p className="font-bold text-gray-700 uppercase text-xs mb-1">Terms & Conditions:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>Payment is due within 30 days.</li>
                    <li>Please quote invoice number in all correspondence.</li>
                    <li>Make checks payable to <span className="font-semibold">{settings.companyName}</span>.</li>
                </ul>
            </div>
            
            <div className="text-center w-48 mx-auto sm:mx-0">
                <div className="h-16 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold text-gray-600 uppercase">Authorized Signatory</p>
                <p className="text-xs text-gray-400">For {settings.companyName}</p>
            </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 print:hidden">
            <p>Generated by PulleyMaster System</p>
        </div>
      </div>
      
      <style>{`
        @media print {
            @page { margin: 10mm; size: A4; }
            html, body, #root {
                height: auto !important;
                overflow: visible !important;
                min-height: 100% !important;
            }
            .no-print { display: none !important; }
            body { 
                background: white !important; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
            }
            .invoice-container {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: none !important;
            }
            /* Force borders to be visible */
            table, th, td { border-color: #d1d5db !important; }
            thead { background-color: #f3f4f6 !important; }
        }
      `}</style>
    </div>
  );
};
