const ytdl = require('yt-dlp-exec');
const path = require('path');

// Function to stream audio from a YouTube URL using cookies
function downloadAudio(youtubeUrl) {
  return ytdl(youtubeUrl, {
    format: 'bestaudio',
    cookies: path.resolve(__dirname, 'cookies.txt'),  // Correct path to cookies.txt
    execPath: path.resolve(__dirname, '../node_modules/yt-dlp-exec/bin/yt-dlp')  // Ensure the correct path to yt-dlp binary
  });
}

module.exports = { downloadAudio };
