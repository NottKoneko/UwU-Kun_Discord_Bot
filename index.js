require('dotenv/config');
const fs = require('node:fs');
const path = require('node:path');
const { handleJoinDM } = require('./joinDm');
const { OpenAI } = require('openai');
const { handleMessageLogging } = require('./logger');
const { handleAuditLogLogging } = require('./auditLogger');
const { loadCommands } = require('./commandHandler');
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

// Initialize the Discord client
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

// Listen for when a new member joins the guild
client.on('guildMemberAdd', async (member) => {
    // Call the function to handle sending the DM
    await handleJoinDM(member);
});

// Handle interaction create (slash commands)
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

client.once('ready', async () => {
    console.log('Bot is online and ready!');
    await handleAuditLogLogging(client);
});






// Event listener for when a message is received
client.on('messageCreate', async (message) => {
    console.log(message.content);

    // Handle logging and conversation processing
    await handleMessageLogging(client, message);



/*
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Find the log server by ID
    const logServer = client.guilds.cache.get(process.env.LOG_SERVER_ID);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    



    // If the log server exists, find or create a channel for the current guild
    if (logServer) {
        // Inside the 'messageCreate' event listener
        try {
            // Create a unique channel name using the guild name and message timestamp
            const channelName = `msg-logs-${message.guild.id}`;
            
            // Sanitize the channel name to remove invalid characters and ensure it does not exceed the maximum length
            const sanitizedChannelName = channelName.slice(0, 100).replace(/[^a-zA-Z0-9-_]/g, '');

            // Log the sanitized channel name for debugging
            console.log('Sanitized Channel Name:', sanitizedChannelName);
                // Log the length of the sanitized channel name
            console.log('Length of Sanitized Channel Name:', sanitizedChannelName.length);


            // Find the existing channel corresponding to the current guild
            let logChannel = logServer.channels.cache.find(
                channel => channel.type === ChannelType.GuildText && channel.name === sanitizedChannelName);

            // If the channel doesn't exist, create a new one
            if (!logChannel) {
                logChannel = await logServer.channels.create({
                    name: sanitizedChannelName,
                    type: 0,
                });
            }

            // Send the message log to the log channel
            logChannel.send(`[${new Date().toLocaleString()}] Author: ${message.author.tag}, Content: ${message.content}`);
        } catch (error) {
            console.error(`Error creating or finding log channel for server ${logServer.name} (${logServer.id}): ${error}`);
        }
*/
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
