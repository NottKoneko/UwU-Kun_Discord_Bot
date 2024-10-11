const { EmbedBuilder } = require('discord.js');

async function handleJoinDM(member) {
    try {
        // Get the server (guild) the member joined
        const guild = member.guild;

        // Create an embedded welcome message
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00FF00') // Set the color of the embed (green in this case)
            .setTitle('Welcome to the Server! 🎉')
            .setDescription(`Hi ${member.displayName}, we're excited to have you join us!`)
            .addFields([
                { name: 'Introduction', value: 'You can introduce yourself in the introduction channel! :)' },
                { name: 'Rules', value: 'Please take a moment to read the server rules to ensure a great experience for everyone.' },
                { name: 'Roles', value: 'You can assign yourself roles in the roles channel.' },
                { name: 'Support', value: 'If you need any help, don’t hesitate to reach out to the moderators.' },
            ])
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Use the user's avatar as the thumbnail
            .setImage(guild.iconURL({ dynamic: true, size: 512 })) // Use the server's icon as the main image
            .setFooter({ text: 'Made by NotKoneko', iconURL: 'https://avatars.githubusercontent.com/u/27027003?s=48&v=4' }) // Non-clickable footer for branding
            .setTimestamp(); // Adds the current timestamp

        // Send the embed as a DM
        await member.send({ embeds: [welcomeEmbed] });
        console.log(`Sent a welcome DM to ${member.displayName}`);
    } catch (error) {
        console.error(`Could not send DM to ${member.displayName}:`, error);
    }
}

module.exports = { handleJoinDM };




