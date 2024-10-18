// Load environment variables from the .env file
require('dotenv/config');

// Import necessary modules and files
const fs = require('node:fs');
const path = require('node:path');
const { handleJoinDM } = require('./joinDm');
const { OpenAI } = require('openai');
const { handleMessageLogging } = require('./logger');
const { handleAuditLogLogging } = require('./auditLogger');
const { getGuildSettings } = require('./DataBaseInit'); 
const { loadCommands } = require('./commandHandler');

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

// Event: Bot is ready and logged in
client.once('ready', async () => {
    console.log('Bot is online and ready!');
    
    // Initialize settings for all guilds the bot is in
    client.guilds.cache.forEach(async (guild) => {
        await getGuildSettings(guild.id);
    });

    // Start logging audit logs
    await handleAuditLogLogging(client);
});

// Event: New member joins a guild
client.on('guildMemberAdd', async (member) => {
    // Handle sending a welcome DM to the new member
    await handleJoinDM(member);
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
