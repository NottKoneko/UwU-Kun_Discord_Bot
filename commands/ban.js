const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Select a member and ban them.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The member to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for banning the user (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // Only users with Ban Members permission can use this
    .setDMPermission(false), // Disable DMs for this command
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided.'; // Get the reason or use a default message
    const member = interaction.guild.members.cache.get(target.id); // Fetch the member from the guild

    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }

    try {
      // Send a DM to the user before banning them
      await target.send(`Hello <@${target.id}>!

        **You have been banned from**: ${interaction.guild.name}
        **Reason**: ${reason}
                
        `);

      // Ban the user from the guild
      await member.ban({ reason: `Banned by an admin: ${reason}` });

      // Reply to the command invoker
      await interaction.reply(`Successfully banned ${target.tag} for: ${reason}`);
    } catch (error) {
      // Handle errors (e.g., if the user has DMs disabled)
      console.error('Error banning the user:', error);
      await interaction.reply({ content: `Failed to ban ${target.tag}. They may have DMs disabled, or I lack the permissions to ban them.`, ephemeral: true });
    }
  },
};
