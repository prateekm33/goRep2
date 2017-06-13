const socketIO = require('socket.io');
const broadcasters = {};
const MAX_PEERS = 2;

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
      initRoomSocketHandlers(socket, message.streamingUser);
    });
    fn('ready');
  });
}

function initRoomSocketHandlers(socket, streamingUser) {
  socket.on('user', _message => {
    const message = JSON.parse(_message);
    if (message.user === message.streamingUser) {
      console.log("Broadcaster room socket id: ", socket.id, " | Broadcaster name: ", message.user);
      const peer = broadcasters[message.user];
      peer.addRoomSocket(socket.id);
    }
  });

  socket.on('peer', _message => {
    const message = JSON.parse(_message);
    const Peer = broadcasters[message.streamingUser];
    // add the current peer to the next available peer 
    //    -- fn returns socket id for next available peer
    const connectedPeer = Peer.addPeer(message.username, socket.id);
    console.log(`Peer ${message.username} at id [ ${socket.id} ] attempting to connect to ${message.streamingUser} at id [ ${connectedPeer} ]...`);
    // let the connected socket know that it has a new peer
    socket.to(connectedPeer).emit('peer', JSON.stringify({
      peer: socket.id
    }));
  });


  socket.on('ice candidate', _message => {
    const message = JSON.parse(_message);
    const sendTo = message.sendTo;
    message.sendTo = socket.id;
    
    socket.to(sendTo).emit('ice candidate', JSON.stringify(message));
  });

  socket.on('offer', _message => {
    const message = JSON.parse(_message);
    const sendTo = message.sendTo;
    message.sendTo = socket.id;
    socket.to(sendTo).emit('offer', JSON.stringify(message));
  });

  socket.on('answer', _message => {
    const message = JSON.parse(_message);
    const sendTo = message.sendTo;
    message.sendTo = socket.id;
    socket.to(sendTo).emit('answer', JSON.stringify(message));
  })

  socket.on('disconnect', () => {
    const Peer = broadcasters[streamingUser];
    Peer.removePeer(socket.id);
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
      this.peers[id] = new Peer(peerName, id);
      this.numPeers++;
      return this.roomSocketID || this.socketID;
    }
  }

  removePeer(id) {
    delete this.peers[id];
    if (this.numPeers === 0) return;
    this.numPeers--;
  }

  addRoomSocket(id) {
    this.roomSocketID = id;
  }


  findNextAvailablePeer() {
    for (let peer in this.peers) {
      if (this.peers[peer].numPeers < this.peers[peer].MAX_PEERS) {
        return this.peers[peer];
      }
    }

    return null;
  }
}