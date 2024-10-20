const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytDlp = require('../services/ytDlp'); // Assuming you have a service to search or play YouTube audio

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel.')
    .addStringOption(option =>
      option.setName('query')
      .setDescription('The song name or URL')
      .setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('query'); // The song name or URL provided by the user

    try {
      // Join the user's voice channel
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply('You need to be in a voice channel to play music!');
      }

      // Connect to Lavalink using Lavacord Manager
      const player = interaction.client.manager.players.get(interaction.guild.id) || await interaction.client.manager.join({
        guild: interaction.guild.id,
        channel: voiceChannel.id,
        node: 'Main',
      });

      // Search for the track or get YouTube audio stream (assuming you have ytDlp for streaming)
      const stream = await ytDlp.downloadAudio(query); // Use yt-dlp to search/download audio

      // Create an audio resource
      const resource = createAudioResource(stream);

      // Create an audio player and play the resource
      const audioPlayer = createAudioPlayer();
      audioPlayer.play(resource);

      // Subscribe the audio player to the voice connection
      player.connection.subscribe(audioPlayer);

      // Respond to the interaction
      await interaction.reply(`Now playing: ${query}`);

      // Handle events for the audio player
      audioPlayer.on(AudioPlayerStatus.Idle, () => {
        player.connection.disconnect(); // Disconnect after the song finishes
      });

    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error playing the song.');
    }
  }
};
