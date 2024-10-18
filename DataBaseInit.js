const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cslrxlgzmosivfgvzhmh.supabase.co'
const supabaseSRKey = process.env.SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseSRKey)

function getGuildSettings(guildId) {
    const { data, error } = await supabase
      .from('guild_settings')
      .select('*')
      .eq('guild_id', guildId)
      .single();
  
    if (error && error.code === 'PGRST116') {
      // No settings found; create default settings
      return await createDefaultGuildSettings(guildId);
    } else if (error) {
      console.error('Error fetching guild settings:', error);
      return null;
    }
  
    return data;
  }
  
  async function createDefaultGuildSettings(guildId) {
    const { data, error } = await supabase
      .from('guild_settings')
      .insert([{ guild_id: guildId }]);
  
    if (error) {
      console.error('Error creating default guild settings:', error);
      return null;
    }
  
    return data[0];
}

// Export an object containing both functions as a default export
module.exports = { getGuildSettings, createDefaultGuildSettings };