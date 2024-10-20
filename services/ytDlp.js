const ytdl = require('yt-dlp-exec');
const path = require('path');

// Function to stream audio from a YouTube URL using cookies
function downloadAudio(youtubeUrl) {
  return ytdl(youtubeUrl, {
    format: 'bestaudio',
    cookies: path.resolve(__dirname, 'cookies.txt')  // Correct path to cookies.txt
  });
}

module.exports = { downloadAudio };

