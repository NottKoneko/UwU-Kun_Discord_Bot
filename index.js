// Load environment variables from the .env file
require('dotenv/config');

// Import necessary modules and files
const fs = require('node:fs');
const path = require('node:path');
const { handleJoinDM } = require('./joinDm');
const { OpenAI } = require('openai');
const { MoonlinkManager } = require('moonlink.js');
const { handleMessageLogging } = require('./logger');
const { handleAuditLogLogging } = require('./auditLogger');
const { getGuildSettings, getMemberRoles, getAdminRoles, getGuildData } = require('./DataBaseInit'); 
const { loadCommands } = require('./commandHandler');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.DB_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Import Discord.js classes and constants
const {
  Client,
  IntentsBitField,
  Collection,
  GatewayIntentBits,
} = require('discord.js');

// Initialize the OpenAI API
const openai = new OpenAI({
    apiKey: process.env.CHAT_OPENAI_API_KEY,
    assistant_name: "Neko-chan"
});

// Initialize the Discord client with necessary intents
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.GuildVoiceStates,  // Required for voice channel interactions
    ],
});

// Initialize commands collection
client.commands = new Collection();

// Load all commands from the commands folder
loadCommands(client);

// When bot is ready
client.once('ready', async () => {
    console.log(`${client.user.tag} is online and ready!`);


    try {
      // Initialize Moonlink.js manager after the bot is ready
      client.moonlink = new MoonlinkManager({
          nodes: [
              {
                  identifier: "Main",
                  host: process.env.LAVALINK_HOST || 'lavalink-on-render-x11q.onrender.com',
                  port: 2333,
                  password: process.env.LAVALINK_PASSWORD || 'your-password',
                  secure: false,
              },
          ],
          clientId: client.user.id,  // Initialize with the bot's client ID
          sendPayload: (guildId, payload) => {
              const guild = client.guilds.cache.get(guildId);
              if (guild) guild.shard.send(payload);
          }
      });

      console.log("Moonlink Manager initialized successfully!");

      // Handle Moonlink.js events
      client.moonlink.on("nodeCreate", node => {
          console.log(`${node.host} was connected`);
      });

      client.moonlink.on("trackStart", async (player, track) => {
          const channel = client.channels.cache.get(player.textChannelId);
          if (channel) channel.send(`Now playing: ${track.title}`);
      });

      client.moonlink.on("trackEnd", async (player, track) => {
          const channel = client.channels.cache.get(player.textChannelId);
          if (channel) channel.send(`Track ended: ${track.title}`);
      });
      
  } catch (error) {
      console.error("Failed to initialize Moonlink Manager:", error);
  }

    // Additional startup processes (e.g., guild settings, member roles)
    try {
      for (const guild of client.guilds.cache.values()) {
        const guildSettings = await getGuildSettings(guild.id);

        if (!guildSettings) {
          console.error(`No guild settings found for guild: ${guild.name} (${guild.id})`);
          continue;
        }

        await guild.members.fetch();

        for (const member of guild.members.cache.values()) {
          const guildData = await getGuildData(guild, member.id);

          const memberRolesArray = Array.isArray(guildData.memberRoles) ? guildData.memberRoles : [];
          const adminRolesArray = Array.isArray(guildData.adminRoles) ? guildData.adminRoles : [];

          console.log(`Roles for ${member.displayName} in ${guild.name}:`, memberRolesArray);
          console.log(`Admin roles for ${guild.name}:`, adminRolesArray);

          const { data: memberData, error: memberError } = await supabase
            .from('guild_members')
            .upsert({
              guild_id: guildSettings.id,
              member_id: member.id,
              role: memberRolesArray,
            }, { onConflict: ['guild_id', 'member_id'] });

          if (memberError) {
            console.error('Error inserting/updating member roles:', memberError);
          } else {
            console.log('Successfully inserted/updated member roles.');
          }

          const { data: settingsData, error: settingsError } = await supabase
            .from('guild_settings')
            .upsert({
              guild_id: guild.id,
              admin_role: adminRolesArray
            }, { onConflict: 'guild_id' });

          if (settingsError) {
            console.error('Error inserting/updating admin role in guild settings:', settingsError);
          } else {
            console.log('Successfully inserted/updated admin role in guild settings.');
          }
        }
      }
    } catch (error) {
      console.error('Error during startup data fetch:', error);
    }

    await handleAuditLogLogging(client);
});

// Event: New member joins a guild
client.on('guildMemberAdd', async (member) => {
    await handleJoinDM(member);
    const guildSettings = await getGuildSettings(member.guild.id);
    const guildData = await getGuildData(member.guild.id, member.id);

    const { data, error } = await supabase
      .from('guild_members')
      .upsert({
        guild_id: guildSettings.id,
        member_id: member.id,
        role: guildData.memberRoles,
      }, { onConflict: ['guild_id', 'member_id'] });

    if (error) {
      console.error('Error inserting/updating member roles:', error);
    } else {
      console.log('Successfully inserted/updated member roles.');
    }
});

// Event: Handling raw WebSocket events for Moonlink.js
client.on("raw", (data) => {
  // Ensure Moonlink is initialized before handling raw events
  if (client.moonlink && typeof client.moonlink.packetUpdate === 'function') {
      client.moonlink.packetUpdate(data); // Forward raw data to Moonlink.js
  } else {
      console.warn("Moonlink is not initialized, unable to handle raw event.");
  }
});

// Event: Handle interactions (slash commands)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
});

