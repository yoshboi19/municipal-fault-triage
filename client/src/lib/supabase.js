import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const DEFAULT_CITIZEN_ID = '11111111-1111-1111-1111-111111111111';

export async function submitClusteredFault({
  rawDescription, aiSummary, faultCategory, severityLevel, longitude, latitude
}) {
  const { data, error } = await supabase.rpc('submit_fault_with_clustering', {
    p_citizen_id: DEFAULT_CITIZEN_ID, p_raw_description: rawDescription,
    p_ai_summary: aiSummary, p_fault_category: faultCategory,
    p_severity_level: severityLevel, p_photo_url: null,
    p_longitude: longitude, p_latitude: latitude
  });
  if (error) throw error;
  return data;
}
