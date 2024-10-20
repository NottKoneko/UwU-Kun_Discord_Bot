const { SlashCommandBuilder } = require('discord.js');
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

      const connection = await voiceChannel.join();
      const stream = ytDlp.downloadAudio(youtubeUrl);
      connection.play(stream);

      // Respond to the interaction
      await interaction.reply(`Now playing: ${trackDetails.name} by ${trackDetails.artist}`);
    } catch (error) {
      console.error(error);
      await interaction.reply('Error playing the requested track.');
    }
  }
};
