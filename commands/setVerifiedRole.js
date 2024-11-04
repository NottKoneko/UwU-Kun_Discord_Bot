const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-verified-role')
        .setDescription('Set the role for verified members.')
        .addRoleOption(option => 
            option.setName('role')
                  .setDescription('Role to assign after verification')
                  .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Admin-only
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        try {
            await supabase.from('server_settings')
                .upsert({ guild_id: guildId, verified_role: role.id }, { onConflict: 'guild_id' });
            await interaction.reply(`Verified role set to ${role.name}`);
        } catch (error) {
            await interaction.reply({ content: 'Failed to set verified role.', ephemeral: true });
        }
    }
};
