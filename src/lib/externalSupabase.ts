import { createClient } from '@supabase/supabase-js'

const externalSupabaseUrl = 'https://xftzkzlfzmkihypyjwjn.supabase.co'
const externalSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdHpremxmem1raWh5cHlqd2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Nzg1MzIsImV4cCI6MjA4MTQ1NDUzMn0.5f0y4Zq6X5Q_SjG80weNvaeQh8qRplYVurDgzBm_OgU'

export const externalSupabase = createClient(externalSupabaseUrl, externalSupabaseKey)
