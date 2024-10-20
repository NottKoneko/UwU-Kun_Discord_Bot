const ytdl = require('yt-dlp-exec');

// Function to stream audio from a YouTube URL
function downloadAudio(youtubeUrl) {
  return ytdl(youtubeUrl, {
    format: 'bestaudio', // Replace 'filter' with 'format' and specify audio only
    quality: 'highestaudio'
  });
}

module.exports = { downloadAudio };

