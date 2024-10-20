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
      // 1. Join the Lavalink node
      const player = interaction.client.manager.players.get(interaction.guild.id);
      if (!player) {
        interaction.client.manager.create({
          guild: interaction.guild.id,
          voiceChannel: voiceChannel.id,
          textChannel: interaction.channel.id,
          selfDeaf: true,
        });
      }

      // Connect the player to the voice channel
      await interaction.client.manager.players.get(interaction.guild.id).connect();

      // 2. Search for the track using Lavalink's search function
      const searchResult = await interaction.client.manager.search(trackName, interaction.user);

      if (searchResult.loadType === 'NO_MATCHES') {
        return interaction.reply('No results found for the track.');
      }

      // 3. Queue the track or play immediately
      const track = searchResult.tracks[0]; // Get the first result
      const currentPlayer = interaction.client.manager.players.get(interaction.guild.id);

      currentPlayer.queue.add(track);

      if (!currentPlayer.playing && !currentPlayer.paused && !currentPlayer.queue.size) {
        currentPlayer.play(); // Play immediately if no other track is playing
      }

      // Respond to the interaction
      await interaction.reply(`Now playing: ${track.title}`);

      // 4. Handle player events (optional)
      currentPlayer.on('end', (data) => {
        if (data.reason === 'REPLACED') return; // Track was replaced
        if (data.reason === 'STOPPED') return;  // Playback was manually stopped
        if (currentPlayer.queue.size) {
          currentPlayer.play(); // Play the next track in the queue
        } else {
          currentPlayer.destroy(); // No more tracks, destroy the player
        }
      });
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error playing the song.');
    }
  }
};
