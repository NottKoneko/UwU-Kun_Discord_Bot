const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel using Lavalink.')
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
      // Create or get the existing player
      let player = interaction.client.manager.players.get(interaction.guild.id);
      if (!player) {
        player = interaction.client.manager.create({
          guild: interaction.guild.id,
          voiceChannel: voiceChannel.id,
          textChannel: interaction.channel.id,
          selfDeafen: true,
        });
      }

      // Connect to the voice channel if not connected
      if (player.state !== 'CONNECTED') player.connect();

      // Search for the track
      const res = await interaction.client.manager.search(trackName, interaction.user);

      if (res.loadType === 'NO_MATCHES' || res.loadType === 'LOAD_FAILED') {
        return interaction.reply('No results found or an error occurred while searching.');
      }

      // Add track(s) to the queue
      if (res.loadType === 'PLAYLIST_LOADED') {
        player.queue.add(res.tracks);
        interaction.reply(`Added playlist **${res.playlist.name}** with ${res.tracks.length} tracks to the queue.`);
      } else {
        player.queue.add(res.tracks[0]);
        interaction.reply(`Added **${res.tracks[0].title}** to the queue.`);
      }

      // Start playing if not already
      if (!player.playing && !player.paused && !player.queue.size) {
        player.play();
      }

      // Handle player events
      player.on('end', () => {
        if (player.queue.size > 0) {
          player.play();
        } else {
          player.destroy();
        }
      });
    } catch (error) {
      console.error(error);
      interaction.reply('There was an error playing the song.');
    }
  },
};
