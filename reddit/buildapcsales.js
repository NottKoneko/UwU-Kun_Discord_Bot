// redditService.js
const axios = require('axios');

const REDDIT_URL = 'https://www.reddit.com/r/buildapcsales/new.json?limit=1';

async function fetchLatestPost() {
  try {
    const response = await axios.get(REDDIT_URL);
    const posts = response.data.data.children;

    if (posts.length === 0) return null;

    const post = posts[0].data;
    return {
      id: post.id,
      title: post.title,
      url: `https://reddit.com${post.permalink}`,
      author: post.author,
      created_utc: post.created_utc,
    };
  } catch (error) {
    console.error('Error fetching data from Reddit:', error);
    return null;
  }
}

module.exports = { fetchLatestPost };
