const socketIO = require('socket.io');
const broadcasters = {};
const MAX_PEERS = 20;

module.exports = server => {
  const io = socketIO.listen(server);

  const broadCastRoom = io.of('/streams/broadcast');
  broadCastRoom.on('connection', socket => initBroadCasterRoom(io, socket));
}

function initBroadCasterRoom(io, socket) {
  socket.on('broadcast', (_message, fn) => {
    const message = JSON.parse(_message);
    console.log("Broadcaster id: ", socket.id, " | ", "Broadcaster name: ", message.streamingUser);
    broadcasters[message.streamingUser] = new Peer(message.streamingUser, socket.id);
    const room = io.of(`/streams/${message.streamingUser}`);
    room.on("connection", socket => {
      initRoomSocketHandlers(socket, message.streamingUser, io, room);
    });
    fn('ready');
  });
}

function initRoomSocketHandlers(socket, streamingUser, io, room) {
  socket.on('user', _message => {
    const message = JSON.parse(_message);
    if (message.userIsStreamer) {
      console.log("Broadcaster room socket id: ", socket.id, " | Broadcaster name: ", message.username);
      const peer = broadcasters[message.username];
      peer.addRoomSocket(socket.id);
    }
  });

  socket.on('peer', _message => {
    const message = JSON.parse(_message);
    const peer = broadcasters[message.streamingUser];
    // add the current peer to the next available peer 
    //    -- fn returns socket id for next available peer
    const connectedPeer = peer.addPeer(message.username, socket.id);
    console.log(`Peer ${message.username} at id [ ${socket.id} ] attempting to connect to [ ${message.streamingUser} ] at id [ ${connectedPeer} ]...`);
    // let the connected socket know that it has a new peer
    socket.broadcast.to(connectedPeer).emit('peer', JSON.stringify({
      peer: socket.id
    }));
  });


  socket.on('ice candidate', _message => {
    const message = JSON.parse(_message);
    const sendTo = message.sendTo;
    message.sendTo = socket.id;

    socket.broadcast.to(sendTo).emit('ice candidate', JSON.stringify(message));
  });

  socket.on('offer', _message => {
    const message = JSON.parse(_message);
    const sendTo = message.sendTo;
    message.sendTo = socket.id;
    socket.broadcast.to(sendTo).emit('offer', JSON.stringify(message));
  });

  socket.on('answer', _message => {
    const message = JSON.parse(_message);
    const sendTo = message.sendTo;
    message.sendTo = socket.id;
    socket.broadcast.to(sendTo).emit('answer', JSON.stringify(message));
  });

  socket.on('closing', () => {
    const peer = broadcasters[streamingUser];
    peer.removePeer(socket.id);
    socket.broadcast.emit('closing', JSON.stringify({
      socketID: socket.id,
      nextPeer: peer.findNextAvailablePeer()
    }));
  })

  socket.on('disconnect', () => {
    const peer = broadcasters[streamingUser];
    const streamEnd = peer ? peer.getId(1) === socket.id : true;
    !streamEnd && peer && peer.removePeer(socket.id);
    console.log(`Socket at id [ ${socket.id} ] disconnected...`);
    room.emit('disconnected', JSON.stringify({
      socketID: socket.id,
      streamEnd
    }));

    if (streamEnd) {
      delete broadcasters[streamingUser];

      for (sockets in room.connected) {
        room.connected[sockets].disconnect();
      }

      room.removeAllListeners(); // Remove all Listeners for the event emitter
      // delete namespace from socket so it can be used again later
      delete io.nsps[`/streams/${streamingUser}`];
    }

  });
}


// TODO -- hash broadcaster/peername before inserting into store --- or hash on client side before sending over network (option 2 is prob better)
class Peer {
  constructor(broadcaster, socketID) {
    this.broadcaster = broadcaster;
    this.socketID = socketID;
    this.roomSocketID = null;
    this.MAX_PEERS = MAX_PEERS;
    this.numPeers = 0;
    this.peers = {};
    this.peersArray = [];
  }

  getId(n) {
    return n === 0 ? this.socketID : this.roomSocketID;
  }

  addPeer(peerName, id) {
    if (this.numPeers >= this.MAX_PEERS) {
      const nextPeer = this.findNextAvailablePeer();
      if (!nextPeer) {
        console.log("ERROR finding next available peer. Cannot connect to stream");
        return; 
      }
      return nextPeer.addPeer(peerName, id);
    } else {
      const newPeer = new Peer(peerName, id);
      this.peers[id] = newPeer;
      this.peersArray.push(newPeer);
      this.numPeers++;
      return this.roomSocketID || this.socketID;
    }
  }

  contains(id) {
    return id in this.peers;
  }

  removePeer(id) {
    const peers = [this];
    let peerIdx = 0;
    while (peerIdx < peers.length) {
      if (peers[peerIdx].contains(id)) return removePeer(peers[peerIdx], id);
      peers.push(...peers[peerIdx].peersArray);
      peerIdx++;
    }

    function removePeer(peer, id) {
      const deletedPeer = peer.peers[id];
      delete peer.peers[id];
      const idx = peer.peersArray.indexOf(deletedPeer);
      peer.peersArray.splice(idx, 1);
      peer.numPeers--;
      return true;
    }
  }

  addRoomSocket(id) {
    this.roomSocketID = id;
  }

  isAvailable() {
    return this.numPeers < this.MAX_PEERS;
  }

  findNextAvailablePeer() {

    const peers = this.peersArray.map(i => i);
    let i = 0;
    while (i < peers.length) {
      console.log('checking for valid peers...');
      peers.push(...peers[i].peersArray);
      if (peers[i].isAvailable()) return peers[i];
      i++;
    }
    return null;
  }

}