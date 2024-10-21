const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel using Moonlink.')
    .addStringOption(option =>
      option.setName('track_name')
      .setDescription('The name or URL of the song you want to play')
      .setRequired(true)),

  async execute(interaction) {
    const trackName = interaction.options.getString('track_name');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply('You need to be in a voice channel to play music!');
    }

    try {
      let player = interaction.client.manager.players.get(interaction.guild.id);
      if (!player) {
        player = interaction.client.manager.createPlayer({
          guildId: interaction.guild.id,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channel.id,
        });
      }

      if (!player.connected) {
        await player.connect();
      }

      const result = await interaction.client.manager.search(trackName, interaction.user);

      if (result.loadType === 'NO_MATCHES') {
        return interaction.reply('No results found.');
      }

      player.queue.add(result.tracks[0]);
      if (!player.isPlaying) player.play();

      await interaction.reply(`Now playing: **${result.tracks[0].title}**`);
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error playing the song.');
    }
  },
};
