// ── Together: backend config ────────────────────────────────────────────────
// Leave both blank and the app runs fully on this one device (nothing leaves
// the phone). Fill them in with a Supabase project's URL and publishable/anon
// key, after running supabase/schema.sql there, and two phones can pair with a
// code and see each other's check-ins live. The publishable key is designed to
// be public: Row Level Security in schema.sql is what keeps each couple's data
// private.
export const SUPABASE_URL = 'https://hbskekfutvxvixafeden.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_SMRAokTTDo7kl1e6AvgW4A_UHVOMZKE'
// Public half of the Web Push (VAPID) key pair. The private half lives only in
// the database's tg_config table, readable by the tg-push function alone.
export const VAPID_PUBLIC = 'BN6qk1Tg7De-qOkPRs0EGpk23Akg25b7u93tnmYDXqp-bw0_IjXrGMebLwSxgIIU7WvN4SwTLo6iMsugBBghxdc'
