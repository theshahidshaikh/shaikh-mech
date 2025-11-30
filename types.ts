
export interface Client {
  id: string;
  name: string;
  contact?: string;
  defaultRate?: number;
}

export interface PulleyItem {
  id: string;
  date: string;
  transactionType: 'IN' | 'OUT'; // IN = Received, OUT = Billed/Sent
  clientId?: string; // Optional: Link to a client
  clientName?: string; // Optional: Denormalized name for display
  diameter: number;
  grooves: number;
  section: string;
  type: string;
  pulleyString: string; // Calculated: `${diameter}x${grooves}x${section}`
  quantity: number;
  rate: number;
  costPerUnit: number;
  machineCost: number;
  boreUnits: number;
  boreRate: number;
  boreCost: number;
  total: number;
  remarks: string;
}

export interface AppSettings {
  defaultRate: number;
  boreRate: number;
  companyName: string;
  companyAddress?: string;
  gstNo?: string;
  currency: string;
}

export interface User {
  email: string;
  companyName: string;
}

export type ViewState = 'dashboard' | 'add-items' | 'tally' | 'billing' | 'clients' | 'settings';
