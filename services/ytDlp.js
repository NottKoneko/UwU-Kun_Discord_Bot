const ytdl = require('yt-dlp-exec');

// Function to stream audio from a YouTube URL
function downloadAudio(youtubeUrl) {
  return ytdl(youtubeUrl, {
    filter: 'audioonly',
    quality: 'highestaudio'
  });
}

module.exports = { downloadAudio };
