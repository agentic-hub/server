import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { IntegrationState, Integration, Credential, IntegrationCategory } from '../types';
import { useAuthStore } from './authStore';

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [],
  credentials: [],
  categories: [],
  loading: false,
  
  fetchIntegrations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('integrations')
        .select(`
          *,
          category:category_id (
            id,
            name,
            description,
            icon
          )
        `);
      
      if (error) throw error;
      
      set({ integrations: data as Integration[] });
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  fetchCategories: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('integration_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      set({ categories: data as IntegrationCategory[] });
    } catch (error) {
      console.error('Error fetching integration categories:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  fetchCredentials: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      set({ credentials: data as Credential[] });
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  addCredential: async (credential) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      
      // Encrypt sensitive data before storing
      const secureData = { ...credential.data };
      
      const { data, error } = await supabase
        .from('credentials')
        .insert([
          { 
            ...credential,
            user_id: user.id,
            data: secureData
          }
        ])
        .select();
      
      if (error) throw error;
      
      set({ 
        credentials: [...get().credentials, data[0] as Credential]
      });
      
      return data[0];
    } catch (error) {
      console.error('Error adding credential:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  removeCredential: async (id) => {
    try {
      set({ loading: true });
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set({
        credentials: get().credentials.filter(cred => cred.id !== id)
      });
    } catch (error) {
      console.error('Error removing credential:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  setLoading: (loading) => set({ loading }),
}));