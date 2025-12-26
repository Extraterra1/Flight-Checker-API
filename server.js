// server.js
import express from 'express'; // if using "type": "module" in package.json
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
// const express = require("express"); // use this instead if not using ES modules

const app = express();
const PORT = 3000;

app.use(express.json()); // parse JSON bodies
app.use(cors());

// Example route
app.get('/flight/', (req, res) => {
  (async () => {
    const { icao, number } = req.query;
    if (!icao || !number) {
      return res.status(400).json({ error: 'Missing required query parameters: icao and number' });
    }

    const effectiveIcao = icao.toUpperCase() === 'WK' ? 'EDW' : icao.toUpperCase() === 'BY' ? 'TOM' : icao;
    const URL = `https://www.flightstats.com/v2/flight-tracker/${effectiveIcao}/${number}`;

    // Select by position and content patterns instead of class names
    const timeSelector = 'div:contains("Scheduled"):is(div:contains("Estimated"), div:contains("Actual")) div[class^="text-helper"]:last-child';
    // Prefer elements whose class contains "StatusContainer" and that contain Scheduled/Departed/Arrived;
    // keep textual fallbacks for other common status labels
    const statusSelector =
      'div[class*="StatusContainer"]:contains("Scheduled"), div[class*="StatusContainer"]:contains("Departed"), div[class*="StatusContainer"]:contains("Arrived")';
    // look for any div whose class contains "AirportCodeLabel" (stable substring), then other fallbacks
    const airportSelector = 'div[class*="AirportCodeLabel"]';

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

      const times = $(timeSelector)
        .map((i, el) => {
          const txt = $(el).text().trim();
          const m = txt.match(/(\d{1,2}:\d{2})/);
          return m ? m[1] : null;
        })
        .get()
        .filter(Boolean);

      // pick the first matched status container, then prefer its first inner div's text
      const statusElem = $(statusSelector).first();
      let statusText = null;
      if (statusElem && statusElem.length) {
        const inner = statusElem.find('div').first();
        statusText = inner && inner.length ? inner.text().trim() : statusElem.text().trim();
        statusText = statusText || null;
      }

      const airportText = $(airportSelector).last().text().trim() || null;
      const timeText = times.at(-1) || null;

      if (airportText !== 'FNC') return res.status(404).json({ error: 'Flight not found or invalid airport code' });

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
