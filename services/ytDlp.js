const ytdl = require('yt-dlp-exec');
const path = require('path');

// Function to stream audio from a YouTube URL
function downloadAudio(youtubeUrl) {
  return ytdl(youtubeUrl, {
    format: 'bestaudio',
    cookies: path.resolve(__dirname, './services/cookies.txt')  // Add path to cookies file
  });
}

module.exports = { downloadAudio };
