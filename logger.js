const { ChannelType } = require('discord.js');
const fs = require('fs');


// Message logging function
async function handleMessageLogging(client, message) {
    // Get the log server using the ID from the env
    const logServer = client.guilds.cache.get(process.env.LOG_SERVER_ID);
    // Ignore messages from bots
    if (message.author.bot) return;

    // If the log server is not found, log an error and return
    if (!logServer) {
        console.error('Log server not found.');
        return;
    }
    // Define the channel name using the guild ID
    const channelName = `msg-logs-${message.guild.id}`;
    const sanitizedChannelName = channelName.slice(0, 100).replace(/[^a-zA-Z0-9-_]/g, '');

    // Log the sanitized channel name for debugging
    console.log('Sanitized Channel Name:', sanitizedChannelName);
    // Log the length of the sanitized channel name
    console.log('Length of Sanitized Channel Name:', sanitizedChannelName.length);

    try {
        let logChannel = logServer.channels.cache.find(
            channel => channel.type === ChannelType.GuildText && channel.name === sanitizedChannelName
        );

        if (!logChannel) {
            logChannel = await logServer.channels.create({
                name: sanitizedChannelName,
                type: ChannelType.GuildText,
            });
        }

        // Check if the message is from the log server itself, prevent logging to avoid loop
        if (message.guild && message.guild.id === logServer.id) {
            return; // Stop execution if the message is from the log channel
        }

        // Prepare the message content for logging
        let logContent = `[${new Date().toLocaleString()}] Author: ${message.author.tag}`;

        // Add the message content if it exists
        if (message.content) {
            logContent += `, Content: ${message.content}`;
        }

        // Check if the message has attachments (e.g., images)
        if (message.attachments.size > 0) {
            // Send the log content first if there's a message part
            await logChannel.send(logContent);

            // Iterate through each attachment
            message.attachments.forEach(async (attachment) => {
                // Check if the attachment is an image
                if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                    // Send the image to the log channel
                    await logChannel.send({
                        content: `Image from ${message.author.tag}:`,
                        files: [attachment.url], // Send the image file
                    });
                }
            });
        } else {
            // If no attachments, just log the content
            await logChannel.send(logContent);
        }

        // Process other parts of the conversation if needed
        await processConversation(message);
    } catch (error) {
        console.error(`Error creating or finding log channel: ${error}`);
    }
}

module.exports = { handleMessageLogging };
