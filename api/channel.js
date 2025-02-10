const axios = require('axios');

const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API_URL = "https://www.googleapis.com/youtube/v3";

// 🎥 Get channel information from @username (handle)
module.exports = async (req, res) => {
  const { username, action } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  let cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  try {
    // Use YouTube search API to resolve channel from handle
    const searchUrl = `${YT_API_URL}/search?part=snippet&type=channel&q=${cleanUsername}&key=${API_KEY}`;
    const searchResponse = await axios.get(searchUrl);

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channelId = searchResponse.data.items[0].snippet.channelId;
    
    if (action === 'videos') {
      return getChannelVideos(res, channelId);
    } else {
      return getChannelInfo(res, channelId);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred', details: error.message });
  }
};

async function getChannelInfo(res, channelId) {
  try {
    const channelInfoUrl = `${YT_API_URL}/channels?part=snippet,contentDetails,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`;
    const channelInfoResponse = await axios.get(channelInfoUrl);

    if (!channelInfoResponse.data.items || channelInfoResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'Detailed channel information not found' });
    }

    const channelInfo = channelInfoResponse.data.items[0];
    res.json({
      id: channelInfo.id,
      title: channelInfo.snippet.title,
      description: channelInfo.snippet.description,
      publishedAt: channelInfo.snippet.publishedAt,
      thumbnails: channelInfo.snippet.thumbnails,
      country: channelInfo.snippet.country || "Unknown",
      viewCount: channelInfo.statistics.viewCount,
      subscriberCount: channelInfo.statistics.subscriberCount,
      videoCount: channelInfo.statistics.videoCount,
      uploadsPlaylistId: channelInfo.contentDetails.relatedPlaylists.uploads,
      banner: channelInfo.brandingSettings.image?.bannerExternalUrl || 'https://via.placeholder.com/1200x200?text=No+Banner'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch channel info', details: error.message });
  }
}

async function getChannelVideos(res, channelId) {
  try {
    const channelResponse = await axios.get(`${YT_API_URL}/channels`, {
      params: { part: 'contentDetails', id: channelId, key: API_KEY },
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
    let videoIds = [];
    let nextPageToken = "";

    do {
      const videosResponse = await axios.get(`${YT_API_URL}/playlistItems`, {
        params: {
          part: 'contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          pageToken: nextPageToken,
          key: API_KEY,
        },
      });

      if (!videosResponse.data.items || videosResponse.data.items.length === 0) {
        break;
      }

      videoIds.push(...videosResponse.data.items.map(item => item.contentDetails.videoId));
      nextPageToken = videosResponse.data.nextPageToken || null;
    } while (nextPageToken);

    res.json({ channelId, videoIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch videos', details: error.message });
  }
}
