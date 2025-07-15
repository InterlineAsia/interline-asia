
// tmp_rovodev_enhanced_deals_loader.js
// Fetches deals from Supabase and applies filters

async function fetchDealsFromSupabase(filters = {}) {
  const { createClient } = supabase;
  const supabaseUrl = SUPABASE_URL;
  const supabaseKey = SUPABASE_ANON_KEY;
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  let query = supabaseClient.from('cruise_deals').select('*');

  if (filters.cruiseType) query = query.eq('cruise_type', filters.cruiseType);
  if (filters.cruiseLine) query = query.ilike('cruise_line', `%${filters.cruiseLine}%`);
  if (filters.destination) query = query.ilike('destination', `%${filters.destination}%`);
  if (filters.ship) query = query.ilike('ship', `%${filters.ship}%`);
  if (filters.duration) {
    if (filters.duration === '1-7') query = query.lte('nights', 7);
    if (filters.duration === '8-14') query = query.gte('nights', 8).lte('nights', 14);
    if (filters.duration === '15+') query = query.gte('nights', 15);
  }
  if (filters.startDate && filters.endDate) {
    query = query.gte('departure_date', filters.startDate).lte('departure_date', filters.endDate);
  }

  const { data, error } = await query.order('departure_date', { ascending: true });

  if (error) {
    console.error('Supabase Error:', error);
    return [];
  }

  return data || [];
}
