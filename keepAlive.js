const express = require('express');
const server = express();

server.all('/', (req, res) => {
  res.send('Your bot is alive!');
});

function keepAlive() {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

module.exports = keepAlive;
