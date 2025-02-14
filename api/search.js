const ytSearch = require('yt-search');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for now
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const query = req.query.q;
  const maxResults = req.query.max || 10;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Perform the search using yt-search
    const result = await ytSearch(query);
    
    // Extracting the first "maxResults" items directly
    const videos = result.videos.slice(0, maxResults).map(item => ({
      title: item.title,
      videoId: item.videoId,
      creator: item.author.name,  // The creator's (channel's) name
      creatorUrl: item.author.url,  // URL to the channel's YouTube page
      creatorImage: item.author.avatar,  // Channel avatar image (creator image)
      thumbnail: item.thumbnail,  // Video thumbnail
      description: item.description,  // Description of the video
      publishDate: item.uploadDate,  // Upload date of the video
      duration: item.timestamp,  // Duration of the video (in seconds)
      creatorId: item.author.channelId || '',
    }));

    // Return the videos data directly (without wrapping in a second array)
    return res.status(200).json(videos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch YouTube data' });
  }
};
