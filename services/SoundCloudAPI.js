const axios = require('axios');
require('dotenv').config();

// SoundCloud client ID (retrieved from environment variables)
const SOUND_CLOUD_CLIENT_ID = process.env.SOUND_CLOUD_CLIENT_ID;

// Function to search for a track on SoundCloud using the API
async function searchOnSoundCloud(query) {
    const response = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
        params: {
            client_id: SOUND_CLOUD_CLIENT_ID,  // Use the client ID from your SoundCloud app
            q: query,
            limit: 1
        }
    });

    if (response.data.collection.length === 0) {
        throw new Error('No tracks found on SoundCloud.');
    }

    // Return the streaming URL or track URL
    return response.data.collection[0].permalink_url; // This is the SoundCloud track URL
}

// Function to download and stream audio from SoundCloud
function streamAudioFromSoundCloud(soundCloudUrl) {
    // In SoundCloud, the streaming URL is often the same as the track URL
    return soundCloudUrl;
}

module.exports = { searchOnSoundCloud, streamAudioFromSoundCloud };
