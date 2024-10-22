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

        if (!voiceChannel) {
            return interaction.reply('You need to be in a voice channel to play music!');
        }

        try {
            let player = interaction.client.moonlink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channel.id,
                autoPlay: true,
            });

            if (!player.connected) {
                await player.connect({
                    setDeaf: true,  // Deafen the bot
                });
            }

            const res = await interaction.client.moonlink.search({
                query: trackName,
                source: 'youtube',  // Use YouTube as the source
                requester: interaction.user.id,
            });

            if (res.loadType === 'loadfailed') {
                return interaction.reply('Error: Failed to load the requested track.');
            } else if (res.loadType === 'empty') {
                return interaction.reply('Error: No results found for the query.');
            }

            if (res.loadType === 'playlist') {
                interaction.reply(`Playlist ${res.playlistInfo.name} has been added to the queue.`);
                res.tracks.forEach(track => player.queue.add(track));
            } else {
                player.queue.add(res.tracks[0]);
                interaction.reply(`Track added to the queue: ${res.tracks[0].title}`);
            }

            if (!player.playing) {
                player.play();
            }

        } catch (error) {
            console.error('Error playing music:', error);
            interaction.reply('There was an error playing the song.');
        }
    },
};
