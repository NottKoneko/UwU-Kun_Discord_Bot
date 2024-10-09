const { ChannelType } = require('discord.js');
const fs = require('fs');


// Audit log, logger function 
async function handleAuditLogLogging(client) {
    // Get the log server using the ID from the environment variables
    const logServer = client.guilds.cache.get(process.env.LOG_SERVER_ID);

    // If the log server is not found, log an error and return
    if (!logServer) {
        console.error('Log server not found.');
        return;
    }

    // Define the channel name for audit logs using the server ID
    const channelName = `audit-logs-${logServer.id}`;
    const sanitizedChannelName = channelName.slice(0, 100).replace(/[^a-zA-Z0-9-_]/g, '');

    // Log the sanitized channel name for debugging
    console.log('Sanitized Channel Name:', sanitizedChannelName);

    try {
        // Find or create the log channel in the log server
        let logChannel = logServer.channels.cache.find(
            channel => channel.type === ChannelType.GuildText && channel.name === sanitizedChannelName
        );

        if (!logChannel) {
            logChannel = await logServer.channels.create({
                name: sanitizedChannelName,
                type: ChannelType.GuildText,
            });
        }
        // Ensure this import is correct at the top of your file
        const { ChannelType, AuditLogEvent } = require('discord.js');

        // Inside your handleAuditLogLogging function, ensure that you reference AuditLogEvent correctly
        client.on('guildAuditLogEntryCreate', async (entry) => {
            const { action, executor, target, reason, changes } = entry;

            // Ensure you use AuditLogEvent correctly
            let logMessage = `[${new Date().toLocaleString()}] Action: ${AuditLogEvent[action]}, Executor: ${executor.tag}`;

            // Add additional details if available
            if (target) logMessage += `, Target: ${target.tag || target.id}`;
            if (reason) logMessage += `, Reason: ${reason}`;
            if (changes) {
                const changesFormatted = changes.map(change => `${change.key}: ${change.old} -> ${change.new}`).join(', ');
                logMessage += `, Changes: ${changesFormatted}`;
            }

            // Send the log message to the log channel
            await logChannel.send(logMessage);
        });

    } catch (error) {
        console.error(`Error creating or finding log channel: ${error}`);
    }
}

module.exports = { handleAuditLogLogging };