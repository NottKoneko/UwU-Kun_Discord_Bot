const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song in your voice channel.')
        .addStringOption(option =>
            option.setName('track_name')
                .setDescription('The name or URL of the song you want to play')
                .setRequired(true)
        ),

    async execute(interaction) {
        const trackName = interaction.options.getString('track_name');
        const voiceChannel = interaction.member.voice.channel;

        // Check if the user is in a voice channel
        if (!voiceChannel) {
            return interaction.reply({
                content: 'You need to be in a voice channel to play music!',
                ephemeral: true, // Show only to the user
            });
        }

        try {
            // Defer reply as searching can take some time
            await interaction.deferReply();

            // Create or get the player for this guild
            let player = interaction.client.moonlink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channel.id,
                autoPlay: true,
            });
            

            // Connect the player to the voice channel if it's not connected
            if (!player.connected) {
                console.log('Player is not connected, attempting to connect...');
                await player.connect({
                    setDeaf: true,  // Deafen the bot to avoid echo
                });
                console.log('Player connected to the voice channel.');
            }

            // Search for the track using Moonlink.js
            const res = await interaction.client.moonlink.search({
                query: trackName,
                source: 'youtube',  // You can change this to another source if needed
                requester: interaction.user.id,
            });

            // Handle search results
            if (res.loadType === 'loadfailed') {
                console.error('Failed to load the requested track:', trackName);
                return interaction.editReply({
                    content: 'Error: Failed to load the requested track.',
                });
            } else if (res.loadType === 'empty') {
                console.error('No results found for the query:', trackName);
                return interaction.editReply({
                    content: 'Error: No results found for your query.',
                });
            }

            // Handle if a playlist is returned
            if (res.loadType === 'playlist') {
                res.tracks.forEach(track => player.queue.add(track)); // Add all tracks from the playlist to the queue
                console.log(`Playlist ${res.playlistInfo.name} added with ${res.tracks.length} tracks.`);
                await interaction.editReply({
                    content: `Playlist **${res.playlistInfo.name}** has been added to the queue with **${res.tracks.length}** tracks.`,
                });
            } else {
                // Add a single track to the queue
                player.queue.add(res.tracks[0]);
                console.log(`Track added to queue: ${res.tracks[0].title}`);
                await interaction.editReply({
                    content: `Track **${res.tracks[0].title}** has been added to the queue.`,
                });
            }

            // Start playing if the player is not already playing
            if (!player.playing) {
                console.log('Player is not playing, starting the track...');
                player.play();
            } else {
                console.log('Player is already playing.');
            }

        } catch (error) {
            console.error('Error playing music:', error);
            interaction.editReply({
                content: 'There was an error while trying to play the track. Please try again later.',
            });
        }
    },
};
