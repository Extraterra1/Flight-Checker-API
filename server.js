// server.js
import express from 'express'; // if using "type": "module" in package.json
// const express = require("express"); // use this instead if not using ES modules

const app = express();
const PORT = 3000;

app.use(express.json()); // parse JSON bodies

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
