

// Ping command that replies with Pong!
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    await interaction.reply('Pong!');
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Repeats the message you provide.')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to repeat')
        .setRequired(true)
    ),
  async execute(interaction) {
    // Retrieve the message from the interaction options
    const userMessage = interaction.options.getString('message');

    // Reply with the provided message
    await interaction.reply(userMessage);
  },
};

