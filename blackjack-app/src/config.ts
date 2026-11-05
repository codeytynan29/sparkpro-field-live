// Optional cloud sync. Leave blank (the default) and progress stays on this device.
// To enable: create a Supabase project, run supabase/schema.sql, enable Email (magic
// link) sign-in, then build with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
