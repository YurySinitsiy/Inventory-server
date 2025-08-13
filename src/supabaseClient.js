import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gnklmtdfzpyrxgnxpduk.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdua2xtdGRmenB5cnhnbnhwZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxOTgwOSwiZXhwIjoyMDcwMjk1ODA5fQ.OB_IWuiWIUTGZKCc84TbN-CvQtx7ALAoi9y993eSY3M";

export const supabase = createClient(supabaseUrl, supabaseKey);
