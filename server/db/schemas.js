const mongoose = require("mongoose");

const peerSchema = mongoose.Schema({
  roomName: { type : String },
  socketID: { type : String, unique: true },
  MAX_PEERS: { type : Number },
  numPeers: { type : Number},
  peersArray: [ { type: mongoose.Schema.Types.Mixed } ],
  peers: { type: mongoose.Schema.Types.Mixed }
})

const roomSchema = mongoose.Schema({
  roomName: { type: String, unique: true},
  peer: { type: String, ref: 'Peer' }
});
const Room = mongoose.model('Room', roomSchema);
const Peer = mongoose.model('Peer', peerSchema);

module.exports = {
  Room,
  Peer
} 


/*
  do not need this file for postgres sequelize configuration
*/