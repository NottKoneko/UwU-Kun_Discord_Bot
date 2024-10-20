const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const SpotifyAPI = require('../services/SpotifyAPI');
const YouTubeAPI = require('../services/YouTubeAPI');
const ytDlp = require('../services/ytDlp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from Spotify via YouTube in your voice channel.')
    .addStringOption(option =>
      option.setName('spotify_url')
      .setDescription('The Spotify song URL')
      .setRequired(true)),

  async execute(interaction) {
    const spotifyUrl = interaction.options.getString('spotify_url');

    try {
      // 1. Get Spotify metadata
      const trackDetails = await SpotifyAPI.getTrackDetails(spotifyUrl);

      // 2. Search for song on YouTube
      const youtubeUrl = await YouTubeAPI.search(trackDetails.name, trackDetails.artist);

      // 3. Join voice channel and play audio
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply('You need to be in a voice channel to play music!');
      }

      // Join the voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      // Create an audio player
      const player = createAudioPlayer();

      // Get the audio stream using yt-dlp
      const stream = ytDlp.downloadAudio(youtubeUrl);

      // Create an audio resource
      const resource = createAudioResource(stream);

      // Play the resource in the audio player
      player.play(resource);

      // Subscribe the player to the voice connection
      connection.subscribe(player);

      // Respond to the interaction
      await interaction.reply(`Now playing: ${trackDetails.name} by ${trackDetails.artist}`);

      // Handle events for the audio player
      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy(); // Disconnect after the song finishes
      });

    } catch (error) {
      console.error(error);
      await interaction.reply('Error playing the requested track.');
    }
  }
};
