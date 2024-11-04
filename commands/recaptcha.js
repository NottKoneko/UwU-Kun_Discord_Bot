const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateRecaptchaStatus } = require('@supabase/supabase-js'); // import Supabase functions
const { createClient } = require('@supabase/supabase-js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle-recaptcha')
        .setDescription('Enable or disable reCAPTCHA for new members.')
        .addBooleanOption(option => 
            option.setName('status')
                  .setDescription('Enable or disable reCAPTCHA')
                  .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Admin-only
    async execute(interaction) {
        const status = interaction.options.getBoolean('status');
        const guildId = interaction.guild.id;

        try {
            await updateRecaptchaStatus(guildId, status);
            await interaction.reply(`reCAPTCHA has been ${status ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            await interaction.reply({ content: 'Failed to update reCAPTCHA status.', ephemeral: true });
        }
    }
};
