const ytdl = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

// Function to stream audio from a YouTube URL using cookies
function downloadAudio(youtubeUrl) {
  const secretCookiesPath = '/etc/secrets/cookies.txt';  // Where your cookies are securely stored
  const writableCookiesPath = '/tmp/cookies.txt';  // Writable location

  // Ensure the cookies file is copied before using it
  if (!fs.existsSync(secretCookiesPath)) {
    throw new Error('Cookies file not found at the secret path.');
  }

  // Copy the cookies file to a writable location (e.g., /tmp/)
  fs.copyFileSync(secretCookiesPath, writableCookiesPath);

  // Now use the copied cookies file in yt-dlp
  return ytdl(youtubeUrl, {
    format: 'bestaudio',
    cookies: writableCookiesPath  // Use the writable copy
  });
}

module.exports = { downloadAudio };
