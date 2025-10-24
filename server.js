// server.js
import express from 'express'; // if using "type": "module" in package.json
// const express = require("express"); // use this instead if not using ES modules

const app = express();
const PORT = 3000;

app.use(express.json()); // parse JSON bodies

// Example route
app.get('/', (req, res) => {
  const { icao, number } = req.query;
  const URL = `https://www.flightstats.com/v2/flight-tracker/${icao}/${number}`;

  console.log(URL);

  res.json({ message: 'API is running!', icao, number });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
