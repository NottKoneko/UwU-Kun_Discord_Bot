const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://cslrxlgzmosivfgvzhmh.supabase.co';
const supabaseSRKey = process.env.SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseSRKey);

// Fetch guild settings when bot starts or joins a guild
async function getGuildSettings(guildId) {
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

// Create default guild settings
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

// Fetch member roles for a specific guild from the guild_members table
async function getMemberRoles(guildId, memberId) {
  const { data, error } = await supabase
    .from('guild_members')
    .select('guild_id, member_id, role')
    .eq('guild_id', guildId)
    .eq('member_id', memberId);

  if (error) {
    console.error('Error fetching member roles:', error);
    return null;
  }

  return data;
}

// Fetch all roles with admin ability from the guild_settings table
async function getAdminRoles(guildId) {
  const { data, error } = await supabase
    .from('guild_settings')
    .select('admin_role')
    .eq('guild_id', guildId)
    .single();

  if (error) {
    console.error('Error fetching admin roles:', error);
    return null;
  }

  return data?.admin_role || [];
}

// Function to handle getting both the member roles and admin roles together
async function getGuildData(guildId, memberId) {
  try {
    // Fetch member roles in the guild
    const memberRoles = await getMemberRoles(guildId, memberId);
    
    // Fetch admin roles for the guild
    const adminRoles = await getAdminRoles(guildId);

    return {
      memberRoles: memberRoles.length > 0 ? memberRoles[0].role : [],
      adminRoles
    };
  } catch (error) {
    console.error('Error fetching guild data:', error);
    return null;
  }
}
/*
// Example: Fetch guild data for a specific member in a guild
(async () => {
  const guildId = '123456789012345678'; // Example guild ID
  const memberId = '987654321098765432'; // Example member ID

  const guildData = await getGuildData(guildId, memberId);

  console.log('Member Roles:', guildData.memberRoles);
  console.log('Admin Roles:', guildData.adminRoles);
})();
*/

// Exporting the functions to use them in other parts of your bot
module.exports = { getGuildSettings, getMemberRoles, getAdminRoles, getGuildData };