// play.js (Command Definition)
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

            // Check if the node is connected
            const node = interaction.client.moonlink.getNode("Main");
            if (!node || !node.connected) {
                return interaction.editReply({
                    content: 'Error: No connected nodes available.',
                });
            }

            // Create or get the player for this guild
            let player = interaction.client.moonlink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channel.id,
                autoPlay: true,
            });

            // Connect the player to the voice channel if it's not connected
            if (!player.connected) {
                await player.connect({
                    setDeaf: true,  // Deafen the bot to avoid echo
                });
            }

            // Search for the track using Moonlink.js
            const res = await interaction.client.moonlink.search({
                query: trackName,
                source: 'youtube',
                requester: interaction.user.id,
            });

            // Handle search results
            if (res.loadType === 'loadfailed') {
                return interaction.editReply({
                    content: 'Error: Failed to load the requested track.',
                });
            } else if (res.loadType === 'empty') {
                return interaction.editReply({
                    content: 'Error: No results found for your query.',
                });
            }

            // Add tracks or playlists to the queue
            if (res.loadType === 'playlist') {
                res.tracks.forEach(track => player.queue.add(track)); // Add all tracks from the playlist
                return interaction.editReply({
                    content: `Playlist **${res.playlistInfo.name}** added with ${res.tracks.length} tracks.`,
                });
            } else {
                player.queue.add(res.tracks[0]); // Add the single track
                return interaction.editReply({
                    content: `Track **${res.tracks[0].title}** has been added to the queue.`,
                });
            }

            // Start playing if the player isn't already playing
            if (!player.playing) {
                player.play();
            }

        } catch (error) {
            console.error('Error playing music:', error);
            return interaction.editReply({
                content: 'There was an error while trying to play the track. Please try again later.',
            });
        }
    },
};

// Interaction handling (index.js)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({
            content: 'There was an error executing this command!',
            ephemeral: true
        });
    }
});
