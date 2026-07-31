import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uiwljtbpwjtnlohkbhsn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpd2xqdGJwd2p0bmxvaGtiaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDMyMzAsImV4cCI6MjEwMTAxOTIzMH0.DzHRIl1DpWIuUzPeG2UwCldMOFwqSWMkHZOAaf9F0Mk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)