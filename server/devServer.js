const proxy = require('proxy-middleware');
const express = require('express');
const url = require('url');
const app = express();

const PORT = 8080;

module.exports = app => {
  app.use('*', proxy(url.parse("http://localhost:8080")));
  app.use(express.static(path.join(__dirname, "..", "client")));
}

require('./routes')(app);

app.listen(PORT, () => {
  console.log("App dev server listening on " + PORT);
});

