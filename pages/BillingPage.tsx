
import React, { useState } from 'react';
import { PulleyItem, AppSettings, Client } from '../types';
import { Button } from '../components/ui/Button';
import { Printer, Users, FileSpreadsheet, Download, FileText } from 'lucide-react';

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
    const originalTitle = document.title;
    document.title = invoiceNumber;
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-content');
    const tableContainer = element?.querySelector('.overflow-x-auto');
    if (tableContainer) {
        tableContainer.classList.remove('overflow-x-auto');
    }

    const opt = {
      margin: 0, // Zero margin for full page look
      filename: `${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
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
        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoice</h1>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto flex-grow">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Client</label>
                <div className="relative">
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                    >
                        <option value="">-- Select Client --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="w-full md:w-auto">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Month</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={handleExportExcel} disabled={billingItems.length === 0} title="Download CSV">
                    <FileSpreadsheet className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Excel</span>
                </Button>
                <Button variant="secondary" onClick={handleDownloadPDF} disabled={billingItems.length === 0} title="Download PDF">
                    <Download className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">PDF</span>
                </Button>
                <Button onClick={handlePrint} disabled={billingItems.length === 0} title="Print Invoice">
                    <Printer className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Print</span>
                </Button>
            </div>
        </div>
      </div>

      {/* INVOICE DESIGN CANVAS */}
      <div className="flex justify-center">
        <div id="invoice-content" className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none mx-auto relative text-gray-800 print:w-full print:max-w-none">
            
            {/* 1. Header with Brand Color */}
            <div className="bg-brand-600 text-white p-8 print:bg-brand-600 print:text-white">
                <div className="flex justify-between items-start">
                    <div>
                         <h1 className="text-4xl font-bold tracking-tight mb-2">{settings.companyName}</h1>
                         <div className="text-brand-100 text-sm space-y-1">
                             <p className="whitespace-pre-wrap max-w-sm">{settings.companyAddress}</p>
                             {settings.gstNo && <p className="font-semibold mt-1">GSTIN: {settings.gstNo}</p>}
                         </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-5xl font-extrabold text-brand-500 opacity-30 absolute top-6 right-8 pointer-events-none">INVOICE</h2>
                        <div className="relative z-10 mt-2">
                             <p className="text-brand-200 text-xs uppercase font-bold tracking-wider">Invoice Number</p>
                             <p className="text-xl font-bold">{invoiceNumber}</p>
                             
                             <p className="text-brand-200 text-xs uppercase font-bold tracking-wider mt-3">Date</p>
                             <p className="text-lg font-medium">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* 2. Bill To Section */}
                <div className="flex justify-between mb-8 border-b border-gray-100 pb-8">
                    <div className="w-1/2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
                        {selectedClient ? (
                            <>
                                <h3 className="text-xl font-bold text-gray-900">{selectedClient.name}</h3>
                                {selectedClient.contact && (
                                    <p className="text-gray-600 mt-1">Attn: {selectedClient.contact}</p>
                                )}
                            </>
                        ) : (
                             <div>
                                 <h3 className="text-xl font-bold text-gray-400 italic">General / All Clients</h3>
                                 <p className="text-gray-400 text-sm">Select a client to populate this section</p>
                             </div>
                        )}
                    </div>
                    <div className="w-1/3 text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billing Period</p>
                        <p className="text-gray-900 font-medium">
                            {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* 3. Items Table */}
                <div className="mb-8 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-brand-600">
                                <th className="py-3 text-xs font-bold text-brand-600 uppercase tracking-wider w-12 text-center">Sr.</th>
                                <th className="py-3 text-xs font-bold text-brand-600 uppercase tracking-wider text-left">Date</th>
                                <th className="py-3 text-xs font-bold text-brand-600 uppercase tracking-wider text-left w-1/3">Description</th>
                                <th className="py-3 text-xs font-bold text-brand-600 uppercase tracking-wider text-right">Qty</th>
                                <th className="py-3 text-xs font-bold text-brand-600 uppercase tracking-wider text-right">Rate</th>
                                <th className="py-3 text-xs font-bold text-brand-600 uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {billingItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                                        No transactions found for this period.
                                    </td>
                                </tr>
                            ) : (
                                billingItems.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-gray-100 print:break-inside-avoid">
                                        <td className="py-3 text-center text-gray-400">{idx + 1}</td>
                                        <td className="py-3 text-gray-600">{item.date.slice(8)}-{item.date.slice(5,7)}</td>
                                        <td className="py-3 font-medium text-gray-900">
                                            {item.pulleyString}
                                            <span className="block text-xs text-gray-400 font-normal">{item.type}</span>
                                        </td>
                                        <td className="py-3 text-right font-medium">{item.quantity}</td>
                                        <td className="py-3 text-right text-gray-600">{item.costPerUnit.toFixed(2)}</td>
                                        <td className="py-3 text-right font-bold text-gray-900">{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. Totals & Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-12">
                    <div className="w-full sm:w-1/2 space-y-6">
                        {/* Bank Details Placeholder */}
                        <div className="bg-gray-50 p-4 rounded border border-gray-100 print:border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Bank Details</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Bank:</span> HDFC Bank</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Account:</span> XXXXXXXXXX</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">IFSC:</span> HDFC000XXXX</p>
                        </div>
                        
                        <div>
                             <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total in words</p>
                             <p className="text-sm text-gray-900 italic capitalize">
                                 {/* Simple placeholder for words conversion - usually handled by library */}
                                 Only {settings.currency || '₹'} {totalAmount.toLocaleString('en-IN')}
                             </p>
                        </div>
                    </div>

                    <div className="w-full sm:w-1/3">
                         <div className="space-y-3">
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-600">Subtotal</span>
                                 <span className="font-medium">{settings.currency || '₹'}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                             {settings.gstNo && (
                                 <div className="flex justify-between text-sm">
                                     <span className="text-gray-600">Tax (0%)</span>
                                     <span className="font-medium">-</span>
                                 </div>
                             )}
                             <div className="border-t-2 border-gray-900 pt-3 mt-3 flex justify-between items-baseline">
                                 <span className="text-base font-bold uppercase">Total</span>
                                 <span className="text-2xl font-bold text-brand-700">{settings.currency || '₹'}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* 5. Footer */}
                <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-end gap-8 print:mt-auto">
                    <div className="text-xs text-gray-400 max-w-sm">
                        <p className="font-bold mb-1">Terms & Conditions:</p>
                        <p>1. Goods once sold will not be taken back.</p>
                        <p>2. Interest @ 18% p.a. will be charged if payment is not made within due date.</p>
                        <p>3. Subject to jurisdiction.</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 w-40 border-b border-gray-400 mb-2"></div>
                        <p className="text-xs font-bold text-gray-900 uppercase">Authorized Signatory</p>
                        <p className="text-[10px] text-gray-500">For {settings.companyName}</p>
                    </div>
                </div>
            </div>
            
            {/* Branding Footer Line */}
            <div className="h-2 bg-brand-600 w-full absolute bottom-0 print:hidden"></div>
        </div>
      </div>
      
      {/* Print CSS */}
      <style>{`
        @media print {
            @page { margin: 0; size: A4; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            #invoice-content { 
                box-shadow: none; 
                margin: 0; 
                width: 100%;
                min-height: 100vh;
            }
            /* Ensure background colors print */
            .bg-brand-600 { background-color: #2563eb !important; color: white !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
        }
      `}</style>
    </div>
  );
};
