const socketIO = require('socket.io');
const dbUtils = require('./db/dbUtils');
const { removePeer, findNextAvailablePeer } = require('./db/PeerUtils');
// TODO -- scale this broadcasters database better...
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
    const room = io.of(`/streams/${message.roomName}`);
    room.on("connection", socket => {
      initRoomSocketHandlers(socket, message.roomName, io, room);
    });
    fn('ready');
  });
}

function initRoomSocketHandlers(socket, roomName, io, room) {
  socket.on('user', _message => {
    const message = JSON.parse(_message);

    if (message.userIsStreamer) {
      dbUtils.addRoom(message.roomName, 
        { roomName: message.roomName, socketID: socket.id, password: message.password }
      )
        .catch(err => {
          console.log("Error...", err);
        });
    }
  });

  socket.on('peer', _message => {
    const message = JSON.parse(_message);
    dbUtils.findPeer(message.roomName)
      .then(connectedPeer => {
        const connectedPeerID = connectedPeer.socketID; //connectedPeer.getId();
        console.log(`Peer at id [ ${socket.id} ] attempting to connect to peer at id [ ${connectedPeerID} ]...`);
        // let the connected socket know that it has a new peer
        socket.broadcast.to(connectedPeerID).emit('peer', JSON.stringify({
          peer: socket.id
        }));
      })
      .catch(err => {
        console.log("Error finding room --- ", err);
      });
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
    const peer = broadcasters[roomName];
    dbUtils.findPeer(message.roomName)
      .then(peer => {
        removePeer(socket.id, peer);
        socket.broadcast.emit('closing', JSON.stringify({
          socketID: socket.id,
          nextPeer: findNextAvailablePeer(peer)
        })); 
      })
      .catch(err => {
        console.log("Error finding peer.....", err);
      });
  })

  socket.on('disconnect', () => {
    console.log("socket disconnected");
    dbUtils.findPeer(roomName)
      .then(peer => {
        const streamEnd = peer ? peer.socketID === socket.id : true; // peer.getId() === socket.id : true;
        !streamEnd && peer && removePeer(socket.id, peer); //peer.removePeer(socket.id);
        console.log(`Socket at id [ ${socket.id} ] disconnected.... Stream ended? - ${streamEnd} `);
        room.emit('disconnected', JSON.stringify({
          socketID: socket.id,
          streamEnd
        }));

        if (streamEnd) {
          dbUtils.removeRoom(roomName);

          for (sockets in room.connected) {
            room.connected[sockets].disconnect();
          }

          room.removeAllListeners(); // Remove all Listeners for the event emitter
          // delete namespace from socket so it can be used again later
          delete io.nsps[`/streams/${roomName}`];
        }
      })
      .catch(err => {
        console.log("Error finding peer....==...", err);
      });
  });
}