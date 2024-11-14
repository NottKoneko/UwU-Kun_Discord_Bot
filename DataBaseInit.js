const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://cslrxlgzmosivfgvzhmh.supabase.co';
const supabaseSRKey = process.env.SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseSRKey);
const { PermissionsBitField } = require('discord.js');

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

async function getAdminRoles(guild) {
  // Ensure the guild is valid
  if (!guild) {
    throw new Error('Guild object is undefined or invalid');
  }

  // Fetch roles from the API (fetches latest roles from the server)
  const roles = await guild.roles.fetch();

  if (!roles) {
    throw new Error('Failed to fetch roles from the guild');
  }

  // Filter roles with the Administrator permission
  const rolesWithAdmin = roles.filter(role =>
    role.permissions.has(PermissionsBitField.Flags.Administrator)
  );

  // Return an array of role names
  return rolesWithAdmin.map(role => role.name);
}



async function getGuildData(guild, memberId) {
  try {
    // Fetch member object from the guild
    const member = await guild.members.fetch(memberId);

    if (!member) {
      throw new Error(`Member with ID ${memberId} not found in guild ${guild.id}`);
    }

    // Fetch member's roles as an array of role IDs or names
    const memberRolesArray = member.roles.cache.map(role => role.name); // Use role.name or role.id as needed

    // Fetch admin roles for the guild (passing the guild object)
    const adminRoles = await getAdminRoles(guild);

    console.log(`Fetched member roles for ${memberId} in guild ${guild.id}:`, memberRolesArray);
    console.log(`Fetched admin roles for guild ${guild.id}:`, adminRoles);

    // Safely handle cases where adminRoles might be empty or undefined
    const adminRolesArray = Array.isArray(adminRoles) ? adminRoles : [];

    return {
      memberRoles: memberRolesArray,
      adminRoles: adminRolesArray,
    };
  } catch (error) {
    console.error('Error fetching guild data:', error);
    return {
      memberRoles: [],
      adminRoles: [],
    }; // Always return arrays to prevent issues elsewhere in your bot
  }
}

async function updateRecaptchaStatus(guildId, status) {
  const { error } = await supabase
      .from('server_settings')
      .upsert({ guild_id: guildId, recaptcha_enabled: status }, { onConflict: 'guild_id' });

  if (error) {
      console.error('Failed to update reCAPTCHA status in database:', error);
      throw new Error('Database update failed');
  }
}

async function getRecaptchaStatus(guildId) {
  const { data, error } = await supabase
      .from('server_settings')
      .select('recaptcha_enabled')
      .eq('guild_id', guildId)
      .single();

  if (error) {
      console.error('Failed to fetch reCAPTCHA status:', error);
      return false;
  }
  return data ? data.recaptcha_enabled : false;
}

async function getChannelId_buildapc(guildId) {
  try {
    const { data, error } = await supabase
      .from('guild_settings')
      .select('r/buildapcsales_CHANNEL_ID')
      .eq('guild_id', guildId)
      .single();

    if (error) {
      console.error('Error fetching channel ID:', error);
      return null;
    }

    return data ? data['r/buildapcsales_CHANNEL_ID'] : null;
  } catch (err) {
    console.error('Error interacting with Supabase:', err);
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
module.exports = { getGuildSettings, getMemberRoles, getAdminRoles, getGuildData, updateRecaptchaStatus, getRecaptchaStatus, getChannelId_buildapc };