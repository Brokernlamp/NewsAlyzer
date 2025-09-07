// Minimal env scaffolding for future Supabase integration without adding runtime deps yet

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

// Placeholder interface to be replaced with @supabase/supabase-js when keys are provided
export const supabase = {
  isConfigured(): boolean {
    return Boolean(getSupabaseConfig());
  },
};


