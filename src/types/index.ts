export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface IntegrationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order?: number;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  user_id: string;
  category_id?: string;
  category?: IntegrationCategory;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  integration_id: string;
  name: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: string;
  scopes?: string[];
  user_data?: {
    user_id: string;
    user_name?: string;
    user_email?: string;
  };
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  integration?: Integration;
}

export interface Credential {
  id: string;
  integration_id: string;
  user_id: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  provider?: string;
  integration?: Integration;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  credential_id: string;
  integration_id: string;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Toolkit {
  id: string;
  name: string;
  description: string;
  user_id: string;
  tools: Tool[];
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: unknown | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: unknown | null) => void;
  setLoading: (loading: boolean) => void;
}

export interface IntegrationState {
  integrations: Integration[];
  credentials: Credential[];
  userIntegrations: UserIntegration[];
  categories: IntegrationCategory[];
  toolkits: Toolkit[];
  tools: Tool[];
  loading: boolean;
  fetchIntegrations: () => Promise<void>;
  fetchCredentials: () => Promise<void>;
  fetchUserIntegrations: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchToolkits: () => Promise<void>;
  fetchTools: () => Promise<void>;
  addCredential: (credential: Omit<Credential, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  removeCredential: (id: string) => Promise<void>;
  addUserIntegration: (userIntegration: Omit<UserIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<UserIntegration>;
  removeUserIntegration: (id: string) => Promise<void>;
  addToolkit: (toolkit: Omit<Toolkit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateToolkit: (id: string, toolkit: Partial<Omit<Toolkit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  removeToolkit: (id: string) => Promise<void>;
  addTool: (tool: Omit<Tool, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTool: (id: string, tool: Partial<Omit<Tool, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  removeTool: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
}