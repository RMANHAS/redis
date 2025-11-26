const express = require('express');
const axios = require('axios');
const { client, connectRedis } = require('./redisClient');

const app = express();
const PORT = 3000;

(async () => {
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();


app.get('/', (req, res) => {
  res.json({ message: 'Redis caching demo is running' });
});


async function fetchPostsFromAPI() {
  const url = 'https://jsonplaceholder.typicode.com/posts';
  const response = await axios.get(url);
  return response.data; // array of posts
}


app.get('/posts', async (req, res) => {
  try {
    const cacheKey = 'posts';

   
    const cached = await client.get(cacheKey);

    if (cached) {
     
      console.log('Serving from Redis cache');
      const posts = JSON.parse(cached);
      return res.json({
        fromCache: true,
        length: posts.length,
        data: posts,
      });
    }


    console.log('Cache miss. Calling external API...');
    const posts = await fetchPostsFromAPI();

   
    await client.set(cacheKey, JSON.stringify(posts), {
      EX: 60,   
    });


    return res.json({
      fromCache: false,
      length: posts.length,
      data: posts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});
