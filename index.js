// Load environment variables from the .env file
require('dotenv/config');

// Import necessary modules and files
const fs = require('node:fs');
const path = require('node:path');
const { handleJoinDM } = require('./joinDm');
const { Manager } = require('moonlink.js');  // Corrected import from Moonlink.js
const { OpenAI } = require('openai');
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
  ChannelType,
  AuditLogEvent,
  Events,
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
        IntentsBitField.Flags.MessageContent
    ],
});

// Initialize commands collection
client.commands = new Collection();

// Load all commands from the commands folder
loadCommands(client);



client.once('ready', async () => {
    console.log('Bot is online and ready!');


    // Initialize Moonlink.js manager after the bot is ready
    try {
        // Initialize Moonlink.js manager
        client.moonlink = new Manager({
          nodes: [
              {
                  identifier: "Main",
                  host: "lavalink-on-render-x11q",  // Lavalink host
                  port: 2333,  // Port for Lavalink
                  password: process.env.LAVALINK_PASSWORD,  // Lavalink password
                  secure: false,  // Since you're using a non-SSL connection
              },
          ],
          clientId: client.user.id,  // Set the client ID after bot is logged in
          send: (guildId, payload) => {
              const guild = client.guilds.cache.get(guildId);
              if (guild) guild.shard.send(payload);
          },
      });

      client.moonlink.on("nodeCreate", node => {
          console.log(`Lavalink Node connected: ${node.host}:${node.port}`);
      });

      client.moonlink.on("nodeError", (node, error) => {
          console.error(`Lavalink Node encountered an error: ${error.message}`);
      });

      client.moonlink.on("nodeDisconnected", (node, reason) => {
          console.warn(`Lavalink Node ${node.identifier} disconnected. Reason: ${reason}`);
      });

      client.moonlink.on("trackStart", async (player, track) => {
          const channel = client.channels.cache.get(player.textChannelId);
          if (channel) channel.send(`Now playing: ${track.title}`);
      });

      client.moonlink.on("trackEnd", async (player, track) => {
          const channel = client.channels.cache.get(player.textChannelId);
          if (channel) channel.send(`Track ended: ${track.title}`);
      });

      console.log("Moonlink Manager initialized successfully!");

      // Only attach the raw event listener after Moonlink is initialized
      client.on("raw", data => {
          if (client.moonlink && client.moonlink.packetUpdate) {
              client.moonlink.packetUpdate(data);  // Pass raw data to Moonlink.js for handling
          } else {
              console.warn("Moonlink is not initialized, cannot handle raw events.");
          }
      });

  } catch (error) {
      console.error("Failed to initialize Moonlink Manager:", error);
  }

    try {
      // Loop through each guild the bot is part of
      for (const guild of client.guilds.cache.values()) {
        // Fetch settings for each guild
        const guildSettings = await getGuildSettings(guild.id);
  
        if (!guildSettings) {
          console.error(`No guild settings found for guild: ${guild.name} (${guild.id})`);
          continue; // Skip to the next guild if settings not found
        }
  
        // Fetch all members of the guild
        await guild.members.fetch(); // Ensures the members cache is populated
  
        // Loop through each member in the guild
        for (const member of guild.members.cache.values()) {
          // Fetch member roles and admin roles for the guild
          const guildData = await getGuildData(guild, member.id);
  
          const memberRolesArray = Array.isArray(guildData.memberRoles) ? guildData.memberRoles : [];
          const adminRolesArray = Array.isArray(guildData.adminRoles) ? guildData.adminRoles : [];
  
          // Log or process the data
          console.log(`Roles for ${member.displayName} in ${guild.name}:`, memberRolesArray);
          console.log(`Admin roles for ${guild.name}:`, adminRolesArray);
  
          // Insert or update the member roles in the database
          const { data: memberData, error: memberError } = await supabase
            .from('guild_members')
            .upsert({
              guild_id: guildSettings.id,  // Use the primary key from guild_settings as the guild_id
              member_id: member.id,        // Member ID
              role: memberRolesArray       // Member roles in the guild (array of roles)
            }, { onConflict: ['guild_id', 'member_id'] }); // Prevents duplicate entries
  
          if (memberError) {
            console.error('Error inserting/updating member roles:', memberError);
          } else {
            console.log('Successfully inserted/updated member roles.');
          }
  
          // Upsert admin roles into 'guild_settings'
          const { data: settingsData, error: settingsError } = await supabase
            .from('guild_settings')
            .upsert({
              guild_id: guild.id,         // Assuming 'guild_id' is the unique identifier in 'guild_settings'
              admin_role: adminRolesArray // Admin roles for the guild
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
  
    // Start logging audit logs after data has been fetched
    await handleAuditLogLogging(client);
  });
  




// Event: New member joins a guild
client.on('guildMemberAdd', async (member) => {
    // Handle sending a welcome DM to the new member
    await handleJoinDM(member);

    // Fetch settings for each guild, assuming this returns the primary key of guild_settings
    const guildSettings = await getGuildSettings(guild.id);

    // Fetch member roles and admin roles for the guild
    const guildData = await getGuildData(member.guild.id, member.id);

    // Log or process the data
    console.log('Member Roles:', guildData.memberRoles);
    console.log('Admin Roles:', guildData.adminRoles);

    // Now let's insert or update the data in the `guild_members` table
    const { data, error } = await supabase
      .from('guild_members')
      .upsert({
        guild_id: guildSettings.id,     // Guild ID
        member_id: member.id,          // Member ID
        role: guildData.memberRoles,   // Member Roles in the guild
      }, { onConflict: ['guild_id', 'member_id'] });  // Ensures no duplicate entries

    if (error) {
      console.error('Error inserting/updating member roles:', error);
    } else {
      console.log('Successfully inserted/updated member roles.');
    }

    // Additional actions based on roles (assigning default role, welcome message, etc.)
    // Example: If the user has an admin role, greet them with a special message
    if (guildData.memberRoles.includes('admin')) {
      await member.send('Welcome, Admin!');
    }
});

// Event: Handle interactions (slash commands)
client.on('interactionCreate', async (interaction) => {
    // Only process slash commands
    if (!interaction.isCommand()) return;

    // Get the command being executed
    const command = client.commands.get(interaction.commandName);

    // If command does not exist, return
    if (!command) return;
    // Execute the command and handle errors
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
});

// Event: Bot joins a new guild
client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name}`);
    
    // Initialize the database for the new guild
    await getGuildSettings(guild.id);

    // Fetch admin roles for the new guild
    const adminRoles = await getAdminRoles(guild.id);

    // Log or process the admin roles
    console.log('Admin Roles:', adminRoles);

    // Perform actions like notifying the admins or logging admin roles
});




// ------------The bot is logged in and ready to operate------------



// Event listener for when a message is received
client.on('messageCreate', async (message) => {
    console.log(message.content);

    // Handle logging and conversation processing
    await handleMessageLogging(client, message);

        // Check if the message content starts with the user ID
        if (!message.content.startsWith(process.env.USER_ID)) return;


        // Build conversation log with system message
        let conversationLog = [
            { role: 'system', content: 'You are a friendly anime cat girl, you are mostly energetic and can be timid at times. Your name is UwU-Kun' },
            { role: 'user', "content": "Who made you?"},
            { role: 'assistant', "content": "I was created by Koneko"},
            { role: 'user', "content": "What is your purpose?"},
            { role: 'assistant', "content": "I am here to assist with any questions or tasks you mave have in a fun and friendly manner"}

        ];

        // Ensure the logStream is defined within this scope
        const guildLogFilePath = `./message_logs/${message.guild.id}_message_log.txt`;
        const logStream = fs.createWriteStream(guildLogFilePath, { flags: 'a' });

        // Log the message with timestamp, guild ID, and author
        const logMessage = `[${new Date().toLocaleString()}] Author: ${message.author.tag}, Content: ${message.content}\n`;
        logStream.write(logMessage);
        
        try {
            // Fetch previous messages for context
            await message.channel.sendTyping();
            let prevMessages = await message.channel.messages.fetch({ limit: 5 });
            prevMessages.reverse();

            // Iterate through previous messages to build conversation log
            prevMessages.forEach((msg) => {
                if (msg.author.bot) return;
                if (msg.author.id == client.user.id) {
                    conversationLog.push({
                        role: 'assistant',
                        content: msg.content,
                        name: msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
                    });
                }
                if (msg.author.id == message.author.id) {
                    conversationLog.push({
                        role: 'user',
                        content: msg.content,
                        name: message.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
                    });
                }
            });
            
            // Request completion from the OpenAI API
            const result = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: conversationLog,
                max_tokens: 750
            });

            // Log the entire response from the OpenAI API
            console.log("OpenAI API Response:", result);

            // Reply to the user with the generated message from OpenAI
            message.reply(result.choices[0].message.content);
        } catch (error) {
            console.error(`Error processing conversation log: ${error.message}`);
            message.reply('Sorry, I encountered an error while processing your request.');
        } finally {
            // Close the log stream
            logStream.end();
        }
    } 
    
);



// Log into Discord using the provided bot token
client.login(process.env.TOKEN); 