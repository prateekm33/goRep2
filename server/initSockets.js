const socketIO = require('socket.io');
const dbUtils = require('./db/dbUtils');
const { removePeer, findNextAvailablePeer, addPeer } = require('./db/PeerUtils');

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
          // console.log("Error...", err);
        });
    }
  });

  socket.on('peer', _message => {
    const message = JSON.parse(_message);
    dbUtils.addPeer(message.roomName, socket.id, message.connectToPeer)
      .then(NAP => {
        console.log("Connected Peer: ", NAP.socketID, socket.id);
        socket.broadcast.to(NAP.get('socketID')).emit('peer', JSON.stringify({
          peer: socket.id
        }));
      }).catch(err => {
        console.log("Error finding room or adding peer...", err);
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

  socket.on('disconnect', () => {
    console.log("socket disconnected");
    dbUtils.findInitiator(roomName)
      .then(peer => {
        const streamEnd = peer ? peer.socketID === socket.id : true;
        console.log(`Socket at id [ ${socket.id} ] disconnected.... Stream ended? - ${streamEnd} `);

        const promise = streamEnd ? 
          dbUtils.removeRoom(roomName).then(() => null) : 
          dbUtils.removePeer(socket.id)
            .then(({chosenPeer, parentPeer}) => ({
              chosenPeer: chosenPeer && chosenPeer.socketID,
              parentPeer: parentPeer && parentPeer.socketID
            }));

        return promise.then((selectedSockets) => {
          room.emit('disconnected', JSON.stringify({
            socketID: socket.id,
            streamEnd,
            parentPeer: selectedSockets && selectedSockets.parentPeer,
            chosenPeer: selectedSockets && selectedSockets.chosenPeer
          }));
          if (streamEnd) {
            for (sockets in room.connected) {
              room.connected[sockets].disconnect();
            }
            room.removeAllListeners(); // Remove all Listeners for the event emitter
            // delete namespace from socket so it can be used again later
            delete io.nsps[`/streams/${roomName}`];
          }
            // nextPeer: nextPeer.socketID
        });
      })
      .catch(err => {
        console.log("Error finding peer....==...", err);
      });
  });



  socket.on('change stream', (_message) => {
    const message = JSON.parse(_message);
    console.log("SERVER EMITTING CHANGE STREAM TO ", message.to);
    socket.broadcast.to(message.to)
      .emit("change stream", JSON.stringify({
        from: message.from,
        stream: message.stream
      }));
  })
}