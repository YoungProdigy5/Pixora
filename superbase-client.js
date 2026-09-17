/* =========================================================
   PIXORA — SUPABASE CLIENT
   ========================================================= */

const PIXORA_SUPABASE_URL =
    "https://hlldyvzgvblxmnygldqd.supabase.co";

const PIXORA_SUPABASE_PUBLISHABLE_KEY =
    "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

window.pixoraSupabase =
    window.supabase.createClient(
        PIXORA_SUPABASE_URL,
        PIXORA_SUPABASE_PUBLISHABLE_KEY
    );
