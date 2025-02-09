const axios = require('axios');


const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API_URL = "https://www.googleapis.com/youtube/v3";

// 🎥 Haalt kanaalinformatie op of alle video-ID’s van een kanaal
export default async function handler(req, res) {
  const { id, type } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Channel ID is required' });
  }

  try {
    if (type === 'videos') {
      // Stap 1: Haal de uploads-playlist-ID op
      const channelResponse = await axios.get(`${YT_API_URL}/channels`, {
        params: { part: 'contentDetails', id, key: API_KEY },
      });

      const channel = channelResponse.data.items[0];
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

      // Stap 2: Haal alle video-ID’s op
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

        videoIds.push(...videosResponse.data.items.map(item => item.contentDetails.videoId));
        nextPageToken = videosResponse.data.nextPageToken || null;
      } while (nextPageToken);

      return res.json({ channelId: id, videoIds });
    }

    // 🎥 Haalt kanaalgegevens op
    const url = `${YT_API_URL}/channels?part=snippet,contentDetails,statistics&id=${id}&key=${API_KEY}`;
    const response = await axios.get(url);
    const channel = response.data.items[0];

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channelInfo = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      publishedAt: channel.snippet.publishedAt,
      thumbnails: channel.snippet.thumbnails,
      country: channel.snippet.country || "Unknown",
      viewCount: channel.statistics.viewCount,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    };

    return res.json(channelInfo);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}
