const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin-only command')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only admins can use this
  async execute(interaction) {
    await interaction.reply('This is an admin-only command.');
  },
};
