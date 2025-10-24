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

    // Select by position and content patterns instead of class names
    const timeSelector = 'div:contains("Scheduled"):is(div:contains("Estimated"), div:contains("Actual")) div[class^="text-helper"]:last-child';
    const statusSelector = 'div:contains("Status"), div:contains("On Time"), div:contains("Delayed"), div:contains("Arrived"), div:contains("Cancelled")';
    const airportSelector = 'div[data-testid*="airport"], div:contains("Airport Code"):last, div:contains("FNC"):last';

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
          .last()
          .last()
          .text()
          .trim()
          .replace(/[^0-9:]/g, '') || null;
      const statusText = $(statusSelector).text().trim() || null;
      const airportText = $(airportSelector).last().text().trim() || null;

      if (airportText !== 'FNC') return res.status(404).json({ error: 'Flight not found or invalid airport code' });

      return res.json({
        message: 'OK',
        flight: `${icao}${number}`,
        time: timeText,
        // status: statusText,
        airport: airportText
      });
    } catch (err) {
      console.error('Error fetching/parsing URL:', err.message);
      return res.status(500).json({ error: 'Failed to fetch or parse page', details: err.message });
    }
  })();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
