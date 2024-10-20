const fs = require('fs');
const ytdl = require('yt-dlp-exec');
const path = require('path');

// Function to stream audio from a YouTube URL using cookies
function downloadAudio(youtubeUrl) {
  const cookiesPath = '/tmp/cookies.txt';  // Ensure this is the correct path to your writable cookies file

  // Debugging: Print a part of the cookies file
  const cookiesContent = fs.readFileSync(cookiesPath, 'utf8');
  console.log("Cookies content (first 100 chars):", cookiesContent.substring(0, 100));

  // Use the cookies file in yt-dlp
  return ytdl(youtubeUrl, {
    format: 'bestaudio',
    cookies: cookiesPath
  });
}

module.exports = { downloadAudio };
