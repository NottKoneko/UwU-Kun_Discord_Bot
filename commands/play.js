const { SlashCommandBuilder } = require('discord.js');
const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');

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
      // Ensure the Lavalink player exists or create it if necessary
      let player = interaction.client.manager.players.get(interaction.guild.id);
      if (!player) {
        player = interaction.client.manager.create({
          guild: interaction.guild.id,
          voiceChannel: voiceChannel.id,
          textChannel: interaction.channel.id,
          selfDeaf: true,
        });
      }

      // Connect the player to the voice channel
      if (!player.connected) await player.connect();

      // Search for the track using Lavalink's search function
      const searchResult = await interaction.client.manager.search(trackName, interaction.user);

      if (searchResult.loadType === 'NO_MATCHES') {
        return interaction.reply('No results found for the track.');
      }

      // Queue the track or play immediately if no track is playing
      const track = searchResult.tracks[0];
      player.queue.add(track);

      if (!player.playing && !player.paused && !player.queue.size) {
        player.play(); // Play immediately if no other track is playing
      }

      await interaction.reply(`Now playing: ${track.title}`);

      // Handle player events
      player.on(AudioPlayerStatus.Idle, () => {
        if (player.queue.size) {
          player.play(); // Play the next track in the queue
        } else {
          player.destroy(); // Destroy the player if no more tracks are left
        }
      });
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error playing the song.');
    }
  },
};
