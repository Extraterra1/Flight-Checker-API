// server.js
import express from 'express'; // if using "type": "module" in package.json
import axios from 'axios';
import * as cheerio from 'cheerio';
// const express = require("express"); // use this instead if not using ES modules

const app = express();
const PORT = 3000;

app.use(express.json()); // parse JSON bodies

// Example route
app.get('/', (req, res) => {
  (async () => {
    const { icao, number } = req.query;
    if (!icao || !number) {
      return res.status(400).json({ error: 'Missing required query parameters: icao and number' });
    }

    const URL = `https://www.flightstats.com/v2/flight-tracker/${icao}/${number}`;

    const timeSelector = 'div.text-helper__TextHelper-sc-8bko4a-0.kbHzdx';
    const statusSelector = 'div.text-helper__TextHelper-sc-8bko4a-0.iicbYn';
    const airportSelector = 'div.route-with-plane__AirportLink-sc-154xj1h-3.kCdJkI';

    try {
      const response = await axios.get(URL, {
        // set a common browser UA to reduce blocking
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        // flightstats may redirect or block; allow following redirects
        maxRedirects: 5,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      const timeText =
        $(timeSelector)
          .eq(5)
          .text()
          .trim()
          .replace(/[^0-9:]/g, '') || null;
      const statusText = $(statusSelector).first().text().trim() || null;
      const airportText = $(airportSelector).first().text().trim() || null;

      return res.json({
        message: 'OK',
        flight: `${icao}${number}`,
        time: timeText,
        status: statusText,
        airport: airportText
      });
    } catch (err) {
      console.error('Error fetching/parsing URL:', err.message);
      return res.status(500).json({ error: 'Failed to fetch or parse page', details: err.message });
    }
  })();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
