const mongoose = require('mongoose');
// needs to be changed at some point for prod
const mongoURI = 'mongodb://localhost/gorep';

mongoose.connect(mongoURI);
module.exports = mongoose.connection;