import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { IntegrationState, Integration, Credential, IntegrationCategory, Toolkit, Tool, UserIntegration } from '../types';
import { useAuthStore } from './authStore';

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [],
  credentials: [],
  userIntegrations: [],
  categories: [],
  toolkits: [],
  tools: [],
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
  
  fetchUserIntegrations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      
      // Fetch user integrations from the API
      const response = await fetch('/api/user-integrations', {
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching user integrations: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Fetch integration details for each user integration
      const userIntegrationsWithDetails = await Promise.all(
        data.map(async (userIntegration: UserIntegration) => {
          // Get integration details
          const { data: integrationData, error: integrationError } = await supabase
            .from('integrations')
            .select('*')
            .eq('id', userIntegration.integration_id)
            .single();
          
          if (integrationError) {
            console.error('Error fetching integration details:', integrationError);
            return userIntegration;
          }
          
          return {
            ...userIntegration,
            integration: integrationData as Integration
          };
        })
      );
      
      set({ userIntegrations: userIntegrationsWithDetails as UserIntegration[] });
    } catch (error) {
      console.error('Error fetching user integrations:', error);
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
      
      // Use the new API endpoint to fetch user credentials
      const response = await fetch(`/api/user-credentials?userId=${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching user credentials: ${response.statusText}`);
      }
      
      const data = await response.json();
      set({ credentials: data as Credential[] });
    } catch (error) {
      console.error('Error fetching credentials:', error);
      
      // Fallback to the old method if the new endpoint fails
      try {
        const { data, error: supabaseError } = await supabase
          .from('credentials')
          .select('*')
          .eq('user_id', user.id);
        
        if (supabaseError) throw supabaseError;
        
        set({ credentials: data as Credential[] });
      } catch (fallbackError) {
        console.error('Error in fallback credential fetch:', fallbackError);
      }
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
  
  addUserIntegration: async (userIntegration) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      set({ loading: true });
      
      // Call the API to add a user integration
      const response = await fetch('/api/user-integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify({
          ...userIntegration,
          user_id: user.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error adding user integration: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Get integration details
      const { data: integrationData, error: integrationError } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', data.integration_id)
        .single();
      
      if (integrationError) {
        console.error('Error fetching integration details:', integrationError);
      } else {
        data.integration = integrationData;
      }
      
      set({ 
        userIntegrations: [...get().userIntegrations, data as UserIntegration]
      });
      
      return data as UserIntegration;
    } catch (error) {
      console.error('Error adding user integration:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  removeUserIntegration: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      
      // Call the API to remove a user integration
      const response = await fetch(`/api/user-integrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error removing user integration: ${response.statusText}`);
      }
      
      set({
        userIntegrations: get().userIntegrations.filter(integration => integration.id !== id)
      });
    } catch (error) {
      console.error('Error removing user integration:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  fetchToolkits: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('toolkits')
        .select(`
          *,
          tools:toolkit_tools(
            id,
            tool_id,
            toolkit_id,
            tool:tools(*)
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Transform the data to match our Toolkit interface
      const transformedData = data.map((toolkit: Record<string, unknown>) => ({
        ...toolkit,
        tools: (toolkit.tools as Array<{ tool: unknown }>).map((toolRelation) => toolRelation.tool)
      }));
      
      set({ toolkits: transformedData as Toolkit[] });
    } catch (error) {
      console.error('Error fetching toolkits:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  fetchTools: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          credential:credential_id(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      set({ tools: data as Tool[] });
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  addToolkit: async (toolkit) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      
      // First, create the toolkit
      const { data, error } = await supabase
        .from('toolkits')
        .insert([
          { 
            name: toolkit.name,
            description: toolkit.description,
            user_id: user.id
          }
        ])
        .select();
      
      if (error) throw error;
      
      const newToolkit = data[0];
      
      // Then, create the tool associations
      if (toolkit.tools && toolkit.tools.length > 0) {
        const toolRelations = toolkit.tools.map(tool => ({
          toolkit_id: newToolkit.id,
          tool_id: tool.id
        }));
        
        const { error: relError } = await supabase
          .from('toolkit_tools')
          .insert(toolRelations);
        
        if (relError) throw relError;
      }
      
      // Fetch the updated toolkits
      await get().fetchToolkits();
      
      return newToolkit;
    } catch (error) {
      console.error('Error adding toolkit:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  updateToolkit: async (id, toolkit) => {
    try {
      set({ loading: true });
      
      // Update the toolkit
      const { error } = await supabase
        .from('toolkits')
        .update({ 
          name: toolkit.name,
          description: toolkit.description
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // If tools are provided, update the tool associations
      if (toolkit.tools) {
        // First, remove existing associations
        const { error: delError } = await supabase
          .from('toolkit_tools')
          .delete()
          .eq('toolkit_id', id);
        
        if (delError) throw delError;
        
        // Then, create new associations
        if (toolkit.tools.length > 0) {
          const toolRelations = toolkit.tools.map(tool => ({
            toolkit_id: id,
            tool_id: tool.id
          }));
          
          const { error: relError } = await supabase
            .from('toolkit_tools')
            .insert(toolRelations);
          
          if (relError) throw relError;
        }
      }
      
      // Fetch the updated toolkits
      await get().fetchToolkits();
    } catch (error) {
      console.error('Error updating toolkit:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  removeToolkit: async (id) => {
    try {
      set({ loading: true });
      
      // First, remove tool associations
      const { error: relError } = await supabase
        .from('toolkit_tools')
        .delete()
        .eq('toolkit_id', id);
      
      if (relError) throw relError;
      
      // Then, remove the toolkit
      const { error } = await supabase
        .from('toolkits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set({
        toolkits: get().toolkits.filter(toolkit => toolkit.id !== id)
      });
    } catch (error) {
      console.error('Error removing toolkit:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  addTool: async (tool) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ loading: true });
      
      const { data, error } = await supabase
        .from('tools')
        .insert([
          { 
            name: tool.name,
            description: tool.description,
            credential_id: tool.credential_id,
            integration_id: tool.integration_id,
            configuration: tool.configuration,
            user_id: user.id
          }
        ])
        .select();
      
      if (error) throw error;
      
      set({ 
        tools: [...get().tools, data[0] as Tool]
      });
      
      return data[0];
    } catch (error) {
      console.error('Error adding tool:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  updateTool: async (id, tool) => {
    try {
      set({ loading: true });
      
      const { error } = await supabase
        .from('tools')
        .update({ 
          name: tool.name,
          description: tool.description,
          credential_id: tool.credential_id,
          integration_id: tool.integration_id,
          configuration: tool.configuration
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the tool in the state
      set({
        tools: get().tools.map(t => t.id === id ? { ...t, ...tool } as Tool : t)
      });
      
      // If this tool is part of any toolkit, refresh toolkits
      await get().fetchToolkits();
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  removeTool: async (id) => {
    try {
      set({ loading: true });
      
      // First, remove tool from any toolkits
      const { error: relError } = await supabase
        .from('toolkit_tools')
        .delete()
        .eq('tool_id', id);
      
      if (relError) throw relError;
      
      // Then, remove the tool
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set({
        tools: get().tools.filter(tool => tool.id !== id)
      });
      
      // Refresh toolkits as they might have contained this tool
      await get().fetchToolkits();
    } catch (error) {
      console.error('Error removing tool:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  setLoading: (loading) => set({ loading }),
}));