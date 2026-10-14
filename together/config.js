// ── Together: backend config ────────────────────────────────────────────────
// Leave both blank and the app runs fully on this one device (nothing leaves
// the phone). Fill them in with a Supabase project's URL and publishable/anon
// key, after running supabase/schema.sql there, and two phones can pair with a
// code and see each other's check-ins live. The publishable key is designed to
// be public: Row Level Security in schema.sql is what keeps each couple's data
// private.
export const SUPABASE_URL = 'https://hbskekfutvxvixafeden.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_SMRAokTTDo7kl1e6AvgW4A_UHVOMZKE'
