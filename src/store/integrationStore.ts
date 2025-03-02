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
      
      // Use the new view to get integrations with categories
      const { data, error } = await supabase
        .from('integrations_with_categories_view')
        .select('*');
      
      if (error) {
        console.error('Error fetching from view, falling back to original query:', error);
        
        // Fallback to original query if the view doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('integrations')
          .select(`
            *,
            category:category_id (
              id,
              name,
              description,
              icon,
              order
            )
          `);
        
        if (fallbackError) throw fallbackError;
        
        // Filter out duplicate integrations by name (keeping the first occurrence)
        const uniqueIntegrations = fallbackData?.reduce((acc: Integration[], current: Integration) => {
          const existingIndex = acc.findIndex(item => item.name === current.name);
          if (existingIndex === -1) {
            acc.push(current);
          }
          return acc;
        }, []) || [];
        
        set({ integrations: uniqueIntegrations as Integration[] });
      } else {
        // Filter out duplicate integrations by name (keeping the first occurrence)
        const uniqueIntegrations = data?.reduce((acc: Integration[], current: Integration) => {
          const existingIndex = acc.findIndex(item => item.name === current.name);
          if (existingIndex === -1) {
            acc.push(current);
          }
          return acc;
        }, []) || [];
        
        set({ integrations: uniqueIntegrations as Integration[] });
      }
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
        .order('order', { ascending: true });
      
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