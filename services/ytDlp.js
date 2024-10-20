const ytdl = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

// Function to stream audio from a YouTube URL using cookies
function downloadAudio(youtubeUrl) {
  // Copy the cookies file from /etc/secrets to /tmp (a writable location)
  const secretCookiesPath = '/etc/secrets/cookies.txt';  // Read-only location
  const writableCookiesPath = '/tmp/cookies.txt';  // Writable location

  // Copy the file
  fs.copyFileSync(secretCookiesPath, writableCookiesPath);

  // Use the copied cookies file in yt-dlp
  return ytdl(youtubeUrl, {
    format: 'bestaudio',
    cookies: writableCookiesPath  // Use the writable copy
  });
}

module.exports = { downloadAudio };
