const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

module.exports = app => {
  app.use(express.static(path.join(__dirname, "..", "client")));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false // false --> querystring library | true --> qs library
  }));
}