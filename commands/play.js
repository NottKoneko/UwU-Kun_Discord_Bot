const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel.')
    .addStringOption(option =>
      option.setName('track_name')
      .setDescription('The name or URL of the song you want to play')
      .setRequired(true)),

  async execute(interaction) {
    const trackName = interaction.options.getString('track_name');
    const voiceChannel = interaction.member.voice.channel;

    // Check if the user is in a voice channel
    if (!voiceChannel) {
      return interaction.reply('You need to be in a voice channel to play music!');
    }

    try {
      // Create or get the existing player
      let player = interaction.client.moonlink.createPlayer({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channel.id,
        autoPlay: true, // Automatically play the track after it is added to the queue
      });

      // Connect the player to the voice channel if it's not already connected
      if (!player.connected) {
        await player.connect({
          setDeaf: true,  // Deafen the bot to avoid hearing itself
        });
      }

      // Search for the track using Moonlink.js
      const res = await interaction.client.moonlink.search({
        query: trackName,
        source: 'youtube', // You can change this to soundcloud, etc. based on your needs
        requester: interaction.user.id,
      });

      // Handle cases when no results are found
      if (res.loadType === 'loadfailed') {
        return interaction.reply('Error: Failed to load the requested track.');
      } else if (res.loadType === 'empty') {
        return interaction.reply('Error: No results found for the query.');
      }

      // Handle playlists and single tracks
      if (res.loadType === 'playlist') {
        interaction.reply(`Playlist ${res.playlistInfo.name} has been added to the queue.`);

        // Add all tracks from the playlist to the queue
        for (const track of res.tracks) {
          player.queue.add(track);
        }
      } else {
        // Add the first track from the search results to the queue
        player.queue.add(res.tracks[0]);
        interaction.reply(`Track added to the queue: ${res.tracks[0].title}`);
      }

      // Start playing if no track is currently playing
      if (!player.playing) {
        player.play();
      }

    } catch (error) {
      console.error(error);
      interaction.reply('There was an error playing the song.');
    }
  },
};
