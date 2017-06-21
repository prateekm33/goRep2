const mongoose = require('mongoose');

const streamersSchema = mongoose.Schema({
  roomName: { type: String, unique: true },
  peer: { type: Object } 
});

const Streamer = mongoose.model('Streamer', streamersSchema);

module.exports = Streamer;