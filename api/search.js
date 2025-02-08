// api/ytSearch.js

const ytSearch = require('yt-search');

module.exports = async (req, res) => {
  const query = req.query.q;
  const maxResults = req.query.max || 10;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Perform the search using yt-search
    const result = await ytSearch(query);
    
    // Extract the first "maxResults" items
    const videos = result.videos.slice(0, maxResults).map(item => ({
      title: item.title,
      videoId: item.videoId,
      creator: item.author.name,
    }));

    return res.status(200).json(videos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch YouTube data' });
  }
};
