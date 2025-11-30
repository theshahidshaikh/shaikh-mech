import { PulleyItem, Client, AppSettings, User } from '../types';
import { supabase } from './supabase';

// ==========================================
// SUPABASE API SERVICE
// ==========================================

// Helper to map DB snake_case to Frontend camelCase
const mapSettingsFromDB = (data: any): AppSettings => ({
    companyName: data.company_name || '',
    companyAddress: data.company_address || '',
    gstNo: data.gst_no || '',
    defaultRate: Number(data.default_rate) || 6,
    boreRate: Number(data.bore_rate) || 50,
    currency: data.currency || ''
});

const mapClientFromDB = (data: any): Client => ({
    id: data.id,
    name: data.name,
    contact: data.contact,
    defaultRate: data.default_rate ? Number(data.default_rate) : undefined
});

const mapItemFromDB = (data: any): PulleyItem => ({
    id: data.id,
    date: data.date,
    transactionType: data.transaction_type as 'IN' | 'OUT',
    clientId: data.client_id,
    clientName: data.client_name,
    diameter: Number(data.diameter),
    grooves: Number(data.grooves),
    section: data.section,
    type: data.type,
    pulleyString: data.pulley_string,
    quantity: Number(data.quantity),
    rate: Number(data.rate),
    costPerUnit: Number(data.cost_per_unit),
    machineCost: Number(data.machine_cost),
    boreUnits: Number(data.bore_units),
    boreRate: Number(data.bore_rate),
    boreCost: Number(data.bore_cost),
    total: Number(data.total),
    remarks: data.remarks || ''
});

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string, companyName?: string, companyDetails?: any): Promise<{ user: User, settings: AppSettings }> => {
    
    if (companyName) {
        // --- SIGN UP ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    company_name: companyName
                },
                // Redirect to specific confirmation page
                emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/email-confirmed` : undefined
            }
        });

        if (authError) throw authError;
        
        // CRITICAL: If session is null, email confirmation is required.
        // We stop here and let the UI show the "Check Email" screen.
        if (authData.user && !authData.session) {
             throw new Error("REGISTRATION_SUCCESS_CONFIRM_EMAIL");
        }

        if (!authData.user) throw new Error("Registration failed");

        // If we are here, it means email confirmation is OFF in Supabase, 
        // so we create settings immediately.
        const newSettings = {
            user_id: authData.user.id,
            company_name: companyName,
            company_address: companyDetails?.address || '',
            gst_no: companyDetails?.gstNo || '',
            default_rate: 6,
            bore_rate: 50,
            currency: ''
        };

        const { error: settingsError } = await supabase
            .from('settings')
            .insert(newSettings);

        if (settingsError) throw settingsError;

        return {
            user: { email: email, companyName },
            settings: mapSettingsFromDB(newSettings)
        };

    } else {
        // --- SIGN IN ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Login failed");

        // Fetch Settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

        const settings = settingsData ? mapSettingsFromDB(settingsData) : {
            companyName: 'My Company',
            companyAddress: '',
            gstNo: '',
            defaultRate: 6,
            boreRate: 50,
            currency: ''
        };

        return {
            user: { email: email, companyName: settings.companyName },
            settings
        };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  // Used when user clicks Email Confirmation link and is auto-logged in by Supabase
  // but doesn't have settings yet.
  ensureSettingsCreated: async (): Promise<AppSettings> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Check if exists
      const { data: existing } = await supabase.from('settings').select('*').eq('user_id', user.id).single();
      if (existing) return mapSettingsFromDB(existing);

      // Create Default
      // Try to get company name from metadata if stored during signup
      const companyName = user.user_metadata?.company_name || 'My Company';
      
      const newSettings = {
          user_id: user.id,
          company_name: companyName,
          company_address: '',
          gst_no: '',
          default_rate: 6,
          bore_rate: 50,
          currency: ''
      };

      const { error } = await supabase.from('settings').insert(newSettings);
      if (error) throw error;
      
      return mapSettingsFromDB(newSettings);
  },

  // --- ITEMS ---
  getItems: async (): Promise<PulleyItem[]> => {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapItemFromDB);
  },

  saveItem: async (item: PulleyItem): Promise<PulleyItem> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbItem = {
        user_id: user.id,
        date: item.date,
        transaction_type: item.transactionType,
        client_id: item.clientId,
        client_name: item.clientName,
        diameter: item.diameter,
        grooves: item.grooves,
        section: item.section,
        type: item.type,
        pulley_string: item.pulleyString,
        quantity: item.quantity,
        rate: item.rate,
        cost_per_unit: item.costPerUnit,
        machine_cost: item.machineCost,
        bore_units: item.boreUnits,
        bore_rate: item.boreRate,
        bore_cost: item.boreCost,
        total: item.total,
        remarks: item.remarks
    };

    let result;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);

    if (isUUID) {
         const { data, error } = await supabase
            .from('items')
            .update(dbItem)
            .eq('id', item.id)
            .select()
            .single();
         if (error) throw error;
         result = data;
    } else {
         const { data, error } = await supabase
            .from('items')
            .insert(dbItem)
            .select()
            .single();
         if (error) throw error;
         result = data;
    }

    return mapItemFromDB(result);
  },

  deleteItem: async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
    if (error) throw error;
  },

  // --- CLIENTS ---
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return (data || []).map(mapClientFromDB);
  },

  saveClient: async (client: Client): Promise<Client> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Sanitize undefined values
    const dbClient = {
        user_id: user.id,
        name: client.name,
        contact: client.contact || null,
        default_rate: client.defaultRate || null
    };

    const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select()
        .single();

    if (error) throw error;
    return mapClientFromDB(data);
  },

  updateClient: async (client: Client): Promise<Client> => {
    const dbClient = {
        name: client.name,
        contact: client.contact || null,
        default_rate: client.defaultRate || null
    };

    const { data, error } = await supabase
        .from('clients')
        .update(dbClient)
        .eq('id', client.id)
        .select()
        .single();

    if (error) throw error;
    return mapClientFromDB(data);
  },

  deleteClient: async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
    if (error) throw error;
  },

  // --- SETTINGS ---
  saveSettings: async (settings: AppSettings): Promise<AppSettings> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbSettings = {
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        gst_no: settings.gstNo,
        default_rate: settings.defaultRate,
        bore_rate: settings.boreRate,
        currency: settings.currency
    };

    const { error } = await supabase
        .from('settings')
        .update(dbSettings)
        .eq('user_id', user.id);

    if (error) throw error;
    return settings;
  }
};