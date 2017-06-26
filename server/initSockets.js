const socketIO = require('socket.io');
const dbUtils = require('./db/dbUtils');
const { removePeer, findNextAvailablePeer, addPeer } = require('./db/PeerUtils');
// TODO -- scale this broadcasters database better...
const broadcasters = {};
// const MAX_PEERS = 20;

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
        { roomName: message.roomName, 
          socketID: socket.id, 
          password: message.password,
          group: 0,
          parentPeer: null
        }
      )
        .catch(err => {
          console.log("Error...", err);
        });
    }
  });

  socket.on('peer', _message => {
    const message = JSON.parse(_message);
    dbUtils.addPeer(message.roomName, socket.id)
      .then(connectedPeer => {
        console.log("Connected Peer: ", connectedPeer, connectedPeer.socketID);
        socket.broadcast.to(connectedPeer.get('socketID')).emit('peer', JSON.stringify({
          peer: socket.id
        }));
      }).catch(err => {
        console.log("Error finding room or adding peer...", err);
      });


    // dbUtils.findInitiator(message.roomName)
    //   .then(mainPeer => {
    //     console.log('--------------- main peer ', mainPeer.get);
    //     const connectedPeer = addPeer(message.roomName, socket.id, mainPeer);
    //     const connectedPeerID = connectedPeer.socketID; //connectedPeer.getId();
    //     console.log(`Peer at id [ ${socket.id} ] attempting to connect to peer at id [ ${connectedPeerID} ]...`);
    //     // let the connected socket know that it has a new peer
    //     return socket.broadcast.to(connectedPeerID).emit('peer', JSON.stringify({
    //       peer: socket.id
    //     }));
    //   })
    //   .catch(err => {
    //     console.log("Error finding room --- ", err);
    //   });
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

  socket.on('disconnect', () => {
    console.log("socket disconnected");
    dbUtils.findInitiator(roomName)
      .then(peer => {
        const streamEnd = peer ? peer.socketID === socket.id : true;
        console.log(`Socket at id [ ${socket.id} ] disconnected.... Stream ended? - ${streamEnd} `);
        room.emit('disconnected', JSON.stringify({
          socketID: socket.id,
          streamEnd
        }));

        const promise = streamEnd ? 
          dbUtils.removeRoom(roomName) : dbUtils.removePeer(socket.id);

        if (streamEnd) {
          for (sockets in room.connected) {
            room.connected[sockets].disconnect();
          }
          room.removeAllListeners(); // Remove all Listeners for the event emitter
          // delete namespace from socket so it can be used again later
          delete io.nsps[`/streams/${roomName}`];
        }

        return promise;
      })
      .catch(err => {
        console.log("Error finding peer....==...", err);
      });
  });
}