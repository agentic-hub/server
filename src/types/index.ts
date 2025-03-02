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

export interface Credential {
  id: string;
  integration_id: string;
  user_id: string;
  name: string;
  data: Record<string, any>;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
}

export interface IntegrationState {
  integrations: Integration[];
  credentials: Credential[];
  categories: IntegrationCategory[];
  loading: boolean;
  fetchIntegrations: () => Promise<void>;
  fetchCredentials: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addCredential: (credential: Omit<Credential, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  removeCredential: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
}