const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const SoundCloudAPI = require('../services/SoundCloudAPI'); // Using the SoundCloud API instead of YouTube

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from SoundCloud in your voice channel.')
    .addStringOption(option =>
      option.setName('track_name')
      .setDescription('The name of the song you want to play from SoundCloud')
      .setRequired(true)),

  async execute(interaction) {
    const trackName = interaction.options.getString('track_name');

    try {
      // 1. Search for the track on SoundCloud
      const soundCloudUrl = await SoundCloudAPI.searchOnSoundCloud(trackName);

      // 2. Join voice channel and play audio
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

      // Get the audio stream from SoundCloud
      const stream = SoundCloudAPI.streamAudioFromSoundCloud(soundCloudUrl);

      // Create an audio resource
      const resource = createAudioResource(stream);

      // Play the resource in the audio player
      player.play(resource);

      // Subscribe the player to the voice connection
      connection.subscribe(player);

      // Respond to the interaction
      await interaction.reply(`Now playing: ${trackName} from SoundCloud`);

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
