const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to search for a video on YouTube based on track name and artist
async function search(query, artist) {
  const searchQuery = `${query} by ${artist}`;
  
  const response = await axios({
    url: 'https://www.googleapis.com/youtube/v3/search',
    method: 'get',
    params: {
      key: YOUTUBE_API_KEY,
      q: searchQuery,
      part: 'snippet',
      type: 'video',
      maxResults: 1
    }
  });

  const videos = response.data.items;
  if (videos.length === 0) {
    throw new Error('No results found on YouTube.');
  }

  const videoId = videos[0].id.videoId;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

module.exports = { search };
