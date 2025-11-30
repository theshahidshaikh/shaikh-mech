
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PulleyItem, AppSettings, Client } from '../types';
import { Button } from '../components/ui/Button';
import { Trash2, Users, History, Edit, Edit2, X, AlertCircle, Plus, Box } from 'lucide-react';

interface AddItemsPageProps {
  items: PulleyItem[];
  clients: Client[];
  settings: AppSettings;
  onAddItem: (item: PulleyItem) => void;
  onUpdateItem: (item: PulleyItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const AddItemsPage: React.FC<AddItemsPageProps> = ({ 
    items, 
    clients, 
    settings, 
    onAddItem, 
    onUpdateItem, 
    onDeleteItem,
    onUpdateSettings
}) => {
  // Use string for inputs to allow empty state for easy deletion/typing
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    transactionType: 'IN' as 'IN' | 'OUT',
    clientId: '',
    diameter: '', // Default empty
    grooves: '',  // Default empty
    section: 'B',
    type: 'V',
    quantity: '', // Default empty (0)
    rate: settings.defaultRate.toString(),
    boreUnits: '', // Default empty (was '0')
    remarks: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateDefaultRate, setUpdateDefaultRate] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [formError, setFormError] = useState<string>('');
  
  // View State for Table
  const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewClientId, setViewClientId] = useState<string>('all');

  // Refs for focusing next input on Enter
  const clientRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const diameterRef = useRef<HTMLInputElement>(null);
  const groovesRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Filtered Sections and Types (Removed unused ones as requested)
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const types = ['V', 'V-STEP'];

  // Update Rate when Client Changes
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client && client.defaultRate) {
        setFormData(prev => ({ ...prev, rate: client.defaultRate!.toString() }));
      } else {
        // Fallback to global default if client doesn't have specific rate
        setFormData(prev => ({ ...prev, rate: settings.defaultRate.toString() }));
      }
    }
  }, [formData.clientId, clients, settings.defaultRate]);

  // Calculate derived values for display
  const calculateValues = () => {
    const d = parseFloat(formData.diameter) || 0;
    const g = parseFloat(formData.grooves) || 0;
    const r = parseFloat(formData.rate) || 0;
    const q = parseFloat(formData.quantity) || 0;
    const bUnits = parseFloat(formData.boreUnits) || 0;

    const costPerUnit = d * g * r;
    const boreCost = bUnits * settings.boreRate;
    const totalMachineCost = costPerUnit * q;
    const total = totalMachineCost + boreCost;
    const pulleyString = d && g ? `${d}x${g}x${formData.section}` : '-';
    return { costPerUnit, boreCost, total, pulleyString, totalMachineCost };
  };

  const derived = calculateValues();

  // --- LIVE STOCK CALCULATION (PROJECTED) ---
  const currentStock = useMemo(() => {
    const d = parseFloat(formData.diameter);
    const g = parseFloat(formData.grooves);
    const q = parseFloat(formData.quantity) || 0;
    
    // Only calculate if we have valid specs
    if (!d || !g) return null;

    // 1. Calculate Base Stock from Database History
    const baseStock = items.reduce((acc, item) => {
        // If editing, ignore the old version of this item in the calc so we don't double count
        if (editingId && item.id === editingId) return acc;

        // Match exact specs
        if (
            item.diameter === d &&
            item.grooves === g &&
            item.section === formData.section &&
            item.type === formData.type
        ) {
            // Add if IN, Subtract if OUT
            return acc + (item.transactionType === 'IN' ? item.quantity : -item.quantity);
        }
        return acc;
    }, 0);

    // 2. Apply Current Form Input to get "Closing Stock"
    // If IN: Base + Input
    // If OUT: Base - Input
    if (formData.transactionType === 'IN') {
        return baseStock + q;
    } else {
        return baseStock - q;
    }
  }, [formData.diameter, formData.grooves, formData.section, formData.type, formData.quantity, formData.transactionType, items, editingId]);

  // Extract all unique specs for Autocomplete
  const allUniqueSpecs = useMemo(() => {
    const unique = new Map();
    // Traverse backwards to prioritize recent items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const key = `${item.diameter}-${item.grooves}-${item.section}-${item.type}`;
        if (!unique.has(key)) {
            unique.set(key, { 
                diameter: item.diameter.toString(), 
                grooves: item.grooves.toString(), 
                section: item.section, 
                type: item.type,
                display: item.pulleyString
            });
        }
    }
    return Array.from(unique.values());
  }, [items]);

  // For the Quick Fill pills (limit to top 6 recent)
  const recentSpecs = allUniqueSpecs.slice(0, 6);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Strip leading zeros for numeric inputs (e.g. "01" -> "1")
    if (['diameter', 'grooves', 'quantity', 'boreUnits', 'rate'].includes(name)) {
        if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
            finalValue = value.replace(/^0+/, '');
        }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    if (name === 'clientId' && value) {
        setFormError('');
    }

    // Auto-complete logic for Diameter
    if (name === 'diameter') {
        if (value.trim()) {
            const matches = allUniqueSpecs.filter(spec => 
                spec.diameter.startsWith(value)
            ).slice(0, 5); // Limit suggestions to 5
            setSuggestions(matches);
            setShowSuggestions(true);
            setActiveSuggestionIndex(-1); // Reset selection
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setActiveSuggestionIndex(-1);
        }
    }
  };

  const applySuggestion = (spec: any) => {
    // Apply values
    setFormData(prev => ({
        ...prev,
        diameter: spec.diameter,
        grooves: spec.grooves,
        section: spec.section,
        type: spec.type
    }));

    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);

    // Hard check against client selection for BOTH transaction types
    if (!formData.clientId) {
        setFormError('Please select a Client / Source');
        clientRef.current?.focus();
    } else {
        setFormError('');
        // Otherwise move focus to Quantity as the main specs are filled
        quantityRef.current?.focus();
    }
  };

  // Generic KeyDown handler for navigation
  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        // If it's a section/type field, just selecting it visually (handled by value) then move focus
        if (nextRef && nextRef.current) {
            nextRef.current.focus();
            if (nextRef.current instanceof HTMLInputElement) {
                nextRef.current.select();
            }
        }
    }
  };

  // Specific handler for Diameter to support Suggestion navigation
  const handleDiameterKeyDown = (e: React.KeyboardEvent) => {
    // If suggestions are visible and we have items
    if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => Math.max(prev - 1, -1));
            return;
        }
        if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            applySuggestion(suggestions[activeSuggestionIndex]);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
            return;
        }
    }

    // Default behavior if not navigating suggestions
    handleKeyDown(e, groovesRef);
  };

  const startEditing = (item: PulleyItem) => {
    setEditingId(item.id);
    setFormData({
        date: item.date,
        transactionType: item.transactionType,
        clientId: item.clientId || '',
        diameter: item.diameter.toString(),
        grooves: item.grooves.toString(),
        section: item.section,
        type: item.type,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        boreUnits: item.boreUnits.toString(),
        remarks: item.remarks
    });
    // Scroll to form
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData(prev => ({
        ...prev,
        diameter: '',
        grooves: '',
        quantity: '',
        boreUnits: '', // Reset to empty
        remarks: ''
    }));
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validation: Client is required for BOTH IN and OUT
    if (!formData.clientId) {
        setFormError("Please select a Client / Source.");
        clientRef.current?.focus();
        return;
    }

    const d = parseFloat(formData.diameter) || 0;
    const g = parseFloat(formData.grooves) || 0;
    const r = parseFloat(formData.rate) || 0;
    const q = parseFloat(formData.quantity) || 0;
    const bUnits = parseFloat(formData.boreUnits) || 0;

    if (d === 0 || g === 0 || q === 0) {
        alert("Diameter, Grooves, and Quantity must be greater than 0");
        return;
    }

    // Update global default rate if checked
    if (updateDefaultRate) {
        onUpdateSettings({ ...settings, defaultRate: r });
    }

    const client = clients.find(c => c.id === formData.clientId);

    const itemData: PulleyItem = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      date: formData.date,
      transactionType: formData.transactionType,
      clientId: formData.clientId,
      clientName: client ? client.name : (formData.clientId || ''),
      diameter: d,
      grooves: g,
      section: formData.section,
      type: formData.type,
      pulleyString: derived.pulleyString,
      quantity: q,
      rate: r,
      costPerUnit: derived.costPerUnit,
      machineCost: derived.totalMachineCost,
      boreUnits: bUnits,
      boreRate: settings.boreRate,
      boreCost: derived.boreCost,
      total: derived.total,
      remarks: formData.remarks
    };

    if (editingId) {
        onUpdateItem(itemData);
        setEditingId(null);
    } else {
        onAddItem(itemData);
    }
    
    // Reset form mostly, keep date/client/transaction type for speed
    setFormData(prev => ({ 
        ...prev, 
        diameter: '', 
        grooves: '', 
        quantity: '', 
        boreUnits: '', 
        remarks: '' 
    }));
    
    // Re-focus diameter for next item
    if (diameterRef.current) {
        diameterRef.current.focus();
    }
  };

  // Filter items for the table view
  const tableItems = items.filter(item => {
    const matchesMonth = item.date.startsWith(viewMonth);
    const matchesClient = viewClientId === 'all' || item.clientId === viewClientId;
    return matchesMonth && matchesClient;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto" ref={formTopRef}>
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{editingId ? 'Edit Item' : 'Add Stock'}</h1>
      </div>

      {/* Speed Entry Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        
        {/* Top Bar: Transaction Type - SWAPPED ORDER: IN FIRST, OUT SECOND */}
        <div className="grid grid-cols-2 text-center text-sm font-bold border-b border-gray-200">
            <button
                type="button"
                onClick={() => {
                    setFormData(p => ({ ...p, transactionType: 'IN' }));
                    if(!formData.clientId) {
                        setFormError("Select Source for IN");
                        setTimeout(() => clientRef.current?.focus(), 50);
                    }
                }}
                className={`py-3 sm:py-4 transition-colors ${formData.transactionType === 'IN' ? 'bg-blue-600 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
                IN (Received)
            </button>
            <button
                type="button"
                onClick={() => {
                    setFormData(p => ({ ...p, transactionType: 'OUT' }));
                    if(!formData.clientId) {
                        setFormError("Select Client for OUT");
                        setTimeout(() => clientRef.current?.focus(), 50);
                    }
                }}
                className={`py-3 sm:py-4 transition-colors ${formData.transactionType === 'OUT' ? 'bg-green-600 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
                OUT (Sent)
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            
            {/* Quick Fill History (Pills) */}
            {!editingId && recentSpecs.length > 0 && (
                <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                        <span className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
                            <History size={12} className="mr-1"/> Recent:
                        </span>
                        {recentSpecs.map((spec, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => applySuggestion(spec)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200 active:bg-brand-100 active:text-brand-700 active:border-brand-200 transition-colors whitespace-nowrap"
                            >
                                {spec.display} ({spec.type})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Client & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="sm:col-span-2">
                    <label className={`text-xs font-bold uppercase mb-1.5 flex items-center gap-2 ${formError ? 'text-red-600' : 'text-gray-500'}`}>
                        Client / Source {formError && <span className="text-[10px] normal-case bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full flex items-center"><AlertCircle size={10} className="mr-1"/> Required</span>}
                    </label>
                    <div className="relative">
                        <select 
                            ref={clientRef}
                            name="clientId" 
                            value={formData.clientId} 
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleKeyDown(e, dateRef)}
                            className={`block w-full rounded-lg shadow-sm focus:ring-brand-500 text-base py-2.5 pl-3 pr-10 bg-white ${formError ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-brand-500'}`}
                        >
                            <option value="">-- Select Client --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                           <Users size={16} />
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Date</label>
                    <input 
                        ref={dateRef}
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, diameterRef)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base py-2"
                        required 
                    />
                 </div>
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            {/* Product Specs Card */}
            <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="w-1/2 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Diameter</label>
                        <input
                            ref={diameterRef}
                            type="text"
                            inputMode="decimal"
                            name="diameter"
                            value={formData.diameter}
                            onChange={handleInputChange}
                            onKeyDown={handleDiameterKeyDown}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click to register
                            onFocus={() => {
                                if (formData.diameter && suggestions.length > 0) setShowSuggestions(true);
                            }}
                            placeholder='0'
                            autoComplete="off"
                            className="block w-full text-center rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-lg font-semibold py-2"
                            required
                        />
                        {/* Autocomplete Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-56 overflow-y-auto">
                                <div className="text-[10px] bg-gray-50 px-3 py-1 text-gray-400 uppercase font-bold border-b border-gray-100">Suggestions (Use ↑↓)</div>
                                {suggestions.map((spec, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onMouseDown={() => applySuggestion(spec)}
                                        className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors ${
                                            idx === activeSuggestionIndex 
                                            ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200' 
                                            : 'text-gray-800 hover:bg-brand-50 hover:text-brand-700'
                                        }`}
                                    >
                                        <span className="font-bold">{spec.display}</span>
                                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{spec.type}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-1/2">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Grooves</label>
                        <input
                            ref={groovesRef}
                            type="text"
                            inputMode="decimal"
                            name="grooves"
                            value={formData.grooves}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleKeyDown(e, sectionRef)}
                            placeholder='0'
                            className="block w-full text-center rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-lg font-semibold py-2"
                            required
                        />
                    </div>
                 </div>

                 {/* Section Input + Chips */}
                 <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Section</label>
                     <input
                        ref={sectionRef}
                        type="text"
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, typeRef)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base py-2 mb-2 uppercase"
                        placeholder="Type or select..."
                     />
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {sections.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    setFormData(p => ({ ...p, section: s }));
                                    typeRef.current?.focus(); // Auto advance on click
                                }}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    formData.section === s 
                                    ? 'bg-gray-800 text-white border-gray-800' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                     </div>
                 </div>

                 {/* Type Input + Chips */}
                 <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Type</label>
                     <input
                        ref={typeRef}
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, quantityRef)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base py-2 mb-2 uppercase"
                        placeholder="Type or select..."
                     />
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {types.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    setFormData(p => ({ ...p, type: t }));
                                    quantityRef.current?.focus(); // Auto advance
                                }}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    formData.type === t 
                                    ? 'bg-gray-800 text-white border-gray-800' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                     </div>
                 </div>
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            {/* Quantity & Rate */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase block">Quantity</label>
                        {/* CURRENT STOCK DISPLAY (PROJECTED) */}
                        {currentStock !== null && (
                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center ${currentStock >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                <Box size={10} className="mr-1"/> 
                                {currentStock >= 0 ? `${currentStock} Rem.` : `Deficit: ${currentStock}`}
                            </div>
                        )}
                    </div>
                    <input
                        ref={quantityRef}
                        type="text"
                        inputMode="numeric"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmit(e as any);
                            }
                        }}
                        placeholder="0"
                        className="block w-full text-center rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-lg font-bold py-2"
                        required
                    />
                </div>
                <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Rate / In-Gr</label>
                    <input
                        ref={rateRef}
                        type="text"
                        inputMode="decimal"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        className="block w-full text-center rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-lg font-semibold py-2"
                        required
                    />
                    <div className="mt-2 flex items-center">
                        <input 
                            id="update-default" 
                            type="checkbox" 
                            checked={updateDefaultRate} 
                            onChange={(e) => setUpdateDefaultRate(e.target.checked)}
                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <label htmlFor="update-default" className="ml-2 block text-xs text-gray-500">
                            Save as Default
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Optional Fields Toggle or just minimal */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Bore Units</label>
                     <input type="text" inputMode="numeric" name="boreUnits" value={formData.boreUnits} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 text-sm py-2" placeholder="0" />
                </div>
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Remarks</label>
                     <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 text-sm py-2" placeholder="Optional" />
                </div>
            </div>

            {/* Total & Submit */}
            <div className="pt-2">
                <div className="flex justify-between items-center mb-3 px-1">
                    <div className="text-sm text-gray-500">{derived.pulleyString}</div>
                    <div className="text-xl font-bold text-brand-700">
                        {settings.currency}{derived.total.toFixed(0)}
                    </div>
                </div>
                {editingId ? (
                    <div className="flex gap-3">
                         <Button type="button" variant="secondary" onClick={cancelEditing} className="flex-1">
                             <X className="w-4 h-4 mr-2" /> Cancel
                         </Button>
                         <Button type="submit" size="lg" className="flex-1 py-3 text-base shadow-lg bg-orange-600 hover:bg-orange-700">
                             <Edit2 className="w-4 h-4 mr-2" /> Update Item
                         </Button>
                    </div>
                ) : (
                    <Button type="submit" size="lg" className={`w-full py-4 text-base shadow-lg transition-all ${formData.transactionType === 'OUT' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'}`}>
                        <Plus className="w-5 h-5 mr-2" /> 
                        {formData.transactionType === 'OUT' ? 'Record Sale (OUT)' : 'Add to Stock (IN)'}
                    </Button>
                )}
            </div>
        </form>
      </div>

      {/* Monthly Transactions Data View (Excel-like Table) */}
      <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                 <History className="w-5 h-5" /> Transactions Log
              </h3>
              
              {/* Table Filters */}
              <div className="flex gap-2 w-full sm:w-auto">
                 <div className="relative flex-1 sm:w-40">
                    <input 
                        type="month" 
                        value={viewMonth}
                        onChange={(e) => setViewMonth(e.target.value)}
                        className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    />
                 </div>
                 <div className="relative flex-1 sm:w-40">
                    <select
                        value={viewClientId}
                        onChange={(e) => setViewClientId(e.target.value)}
                        className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    >
                        <option value="all">All Clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="min-w-[800px] w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-[120px]">Pulley</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bore</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cost/U</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">M/C Cost</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bore Cost</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tableItems.length === 0 ? (
                            <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-500 text-sm">No transactions found for this period.</td></tr>
                        ) : (
                            tableItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                                        <div className="flex flex-col">
                                            <span>{item.pulleyString}</span>
                                            <span className="text-[10px] text-gray-400 font-normal">{item.clientName} | {item.date.slice(5)}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{item.type}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{item.boreUnits || '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        <span className={item.transactionType === 'IN' ? 'text-blue-600' : 'text-green-600'}>
                                            {item.transactionType === 'IN' ? '+' : '-'}{item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{item.rate}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{item.costPerUnit}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{item.machineCost}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{item.boreCost || '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{item.total}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => startEditing(item)} className="text-gray-400 hover:text-brand-600 transition-colors">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => onDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                 </table>
             </div>
          </div>
      </div>
    </div>
  );
};
