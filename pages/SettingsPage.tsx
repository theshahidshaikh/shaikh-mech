
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Save } from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [msg, setMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'companyName' || name === 'companyAddress' || name === 'gstNo' || name === 'currency' 
        ? value 
        : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setMsg('Settings saved successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
            <div className="space-y-4">
              <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} />
              <Input label="Company Address" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} placeholder="Line 1, Line 2, City - Zip" />
              <Input label="GST / Tax No." name="gstNo" value={formData.gstNo || ''} onChange={handleChange} placeholder="Optional" />
            </div>
            <p className="text-xs text-gray-500 mt-2">These details will appear on your generated invoices.</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Default Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Default Rate (per Inch-Gr)" type="number" step="0.1" name="defaultRate" value={formData.defaultRate} onChange={handleChange} />
                <Input label="Bore Rate (per Unit)" type="number" step="1" name="boreRate" value={formData.boreRate} onChange={handleChange} />
                {/* Currency Input Removed */}
            </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
            {msg && <span className="text-green-600 text-sm font-medium animate-pulse">{msg}</span>}
            <Button type="submit" className="ml-auto w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
        </div>
      </form>
      
      <div className="text-center text-xs text-gray-400 pt-8">
        ShaikhMech App v1.3.0 (Print Optimized)
      </div>
    </div>
  );
};