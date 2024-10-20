const axios = require('axios');
require('dotenv').config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let accessToken = null;

// Function to get Spotify access token
async function getAccessToken() {
  if (accessToken) return accessToken;

  const response = await axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    params: {
      grant_type: 'client_credentials'
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    }
  });

  accessToken = response.data.access_token;
  return accessToken;
}

// Function to extract track ID from Spotify URL
function extractSpotifyTrackId(url) {
  const regex = /track\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to get track details from Spotify
async function getTrackDetails(spotifyUrl) {
  const trackId = extractSpotifyTrackId(spotifyUrl);
  if (!trackId) throw new Error('Invalid Spotify URL.');

  const token = await getAccessToken();
  const response = await axios({
    url: `https://api.spotify.com/v1/tracks/${trackId}`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const track = response.data;
  return {
    name: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    album: track.album.name
  };
}

module.exports = { getTrackDetails };
