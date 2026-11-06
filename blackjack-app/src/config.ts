// Cloud backup & sync. Progress is stored under a private 12-character sync code via
// two database functions (bj_pull / bj_push, see supabase/schema.sql). The publishable
// key is designed to be public; the code itself is what keeps a player's data private.
// Override at build time with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, or set both
// to empty strings to build a device-only version.
const env = import.meta.env
export const SUPABASE_URL: string = env.VITE_SUPABASE_URL ?? 'https://hbskekfutvxvixafeden.supabase.co'
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_SMRAokTTDo7kl1e6AvgW4A_UHVOMZKE'
export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
