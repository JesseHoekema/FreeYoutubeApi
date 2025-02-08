const ytSearch = require('yt-search');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for now
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query.q;
  const maxResults = req.query.max || 10;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Perform the search using yt-search
    const result = await ytSearch(query);
    
    // Extracting the first "maxResults" items
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
