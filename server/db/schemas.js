const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
  roomName: { type: String, unique: true},
  peer: { type: Object }
});
const Room = mongoose.model('Room', roomSchema);

module.exports.Room = Room;

