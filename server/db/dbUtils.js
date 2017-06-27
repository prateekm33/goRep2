const broadcasters = {};
const Sequelize = require('sequelize');
const config = require('../config.json');
const { makePeer } = require('./PeerUtils');
const MAX_PEERS = 2;
// const pool = require('./init').pool;
const { Room, Peer } = (() => {
  switch (config.db) {
    case 'mongo':
      return require('./schemas');
    case 'sequelize':
      return require('./init');
  }
})();

const findInitiator = roomName => {
  switch (config.db) {
  // *** for mongodb config *** 
    case 'mongo': { 
      return Room.findOne({ roomName })
        .then(room => {
          return Peer.findById(room.peer)
            .then(_peer => {
              console.log('found peer? ', _peer);
              return _peer
            });
          // return room ? room.peer : null
        });
    }

    // *** below is for postgres sequelize configuration ***
    case 'sequelize':{
      return Room.findOne({
        where: { roomName },
        attributes: ['peer']
      }).then(room => {
        console.log("[findInitiator] Room???", room);
        if (!room) { /* err */ return; }
        return Peer.findOne({
          where: { socketID : room.peer },
        }).then(peer => peer ? peer : null)
      });
    }
  }
}

const addPeer = (roomName, newPeerID) => {
  return findNextAvailable(roomName)
    .then(peer => {
      console.log("[addPeer] peer? ", peer);
      if (!peer) { /* err */ return null; }
      return Peer.findOne({
        where: { socketID: newPeerID }
      }).then(p => {
        if (!p) {
          return Peer.create(makePeer({
            roomName,
            socketID: newPeerID,
            parentPeer: peer.socketID
          }));
        }

        return p.update({ parentPeer: peer.socketID })
      }).then(saved => {
        return peer.update({ numPeers: peer.numPeers + 1});
      });
    });

  // Room.findOne({
  //   where: { roomName }
  // }).then(room => {
  //   return findNextAvailable(roomName, room.group)
  //     .then(NAP => {
  //       return NAP.update({ numPeers: NAP.numPeers + 1});
  //     }).then(NAP => {
  //       return Peer.create(makePeer({
  //         roomName,
  //         socketID: newPeerID,
  //         group: NAP.group + 1
  //       })).then(() => NAP);
  //     })
  // });


  // return Room.findOne({
  //   where: { roomName },
  //   attributes: ['group']
  // }).then(room => {
  //   return Peer.findOne({
  //     where: {
  //       group: room.group,
  //       numPeers: {
  //         $lt: MAX_PEERS
  //       }
  //     }
  //   });
  // }).then(peer => {
  //   return peer.update({
  //     numPeers: peer.numPeers+1
  //   });
  // }).then(NAP => {
  //   return Peer.create(makePeer({
  //     roomName,
  //     socketID: newPeerID,
  //     group: NAP.group + 1
  //   })).then(() => NAP);
  // });
}

const findNextAvailable = (roomName) => {
  return Peer.findOne({
    where: {
      roomName,
      numPeers: {
        $lt : MAX_PEERS
      }
    }
  }).then(peer => peer);


  // return Peer.findOne({
  //   where: { 
  //     numPeers: {
  //       $lt : MAX_PEERS
  //     }
  //   },
  //   include: [
  //     {
  //       model: Room,
  //       where: { 
  //         roomName : Sequelize.col('peer.roomName'),
  //         group : Sequelize.col('peer.group')
  //       }
  //     }
  //   ]
  // }).then(peer => {
  //   if (!peer) {
  //     return Room.update({ group: group + 1}, { where: { roomName }})
  //       .then(() => findNextAvailable(roomName, group + 1))
  //   }
  //   console.log("NAP: -----------------", peer);
  //   return peer;
  // });
}

const addRoom = (roomName, peer) => {

  switch (config.db) {
    case 'mongo': {
      const newPeer = makePeer(peer);
      console.log('------ new peer: ', newPeer);

      const savedPeer = new Peer(newPeer);
      return savedPeer.save().then(_peer => {
        console.log('peer saved : ', _peer);
        const newRoom = new Room({ roomName, peer: _peer._id });
        return newRoom.save().then(room => {
          console.log('room saved: ', room);
          return room;
        }).catch(err => {
          console.log("error add room : ", err);
          return err;
        })
      }).catch(err => {
        console.log("saved peer error: ", err);
      });
    }

    case 'sequelize': {
      return Peer.create({
        roomName, 
        peer: peer.socketID,
        group: 0
      }).then(room => Room.create(makePeer(peer)))
    }    
  }
}

const removeRoom = roomName => {
  switch (config.db) {
    case 'mongo': {
      return Room.findOne({ roomName })
        .then(room => room.remove());
      }
    case 'sequelize': {
      // *** postgres sequelize config *** 
      return Room.destroy({
        where: { roomName }
      }).then(() => Peer.destroy({
        where: { roomName }
      }));
    }
  }
}

const removePeer = socketID => {
  return Peer.destroy({
    where: { socketID }
  }).then(destroyedPeer => {
    console.log("[removePeer] destroyedPeer ? ", destroyedPeer);
    if (!destroyedPeer) return null;
    console.log("UPDATING PARENT PEER TO DESTROYED PEER");
    return Peer.findOne({
      where: { socketID: destroyedPeer.parentPeer }
    })
  }).then(peer => peer ? peer.update({ numPeers: peer.numPeers - 1 }) : null)
}


const findRoom = roomName => {
  switch (config.db) {
    case 'mongo': {
      console.log("checking for room ", roomName);
      return Room.findOne({ roomName })
        .then(room => {
          console.log("room found? ", room);
          return room;
        })
        .catch(err => {
          console.log('find room error: ', err);
        });
    }

    case 'sequelize': {
      console.log("checking for room sequelize...")
      // *** postgres sequelize config ***
      return Room.findOne({
        where: { roomName }
      }).then(room => {
        console.log("[findRoom] room foun\d? ", room);
        return room;
      });
    }
  }
}


const savePeer = (model, newVal) => {
  switch (config.db) {
    case 'mongo':
      // *** only mongodb config ***
      model.markModified('peers');
      model.markModified('peersArray');
      model.markModified('numPeers');
      return model.save();
    case 'sequelize':
      return model.update(newVal);
  }
}


module.exports = {
  savePeer,
  removePeer,
  removeRoom,
  addRoom,
  findNextAvailable,
  addPeer,
  findInitiator,
  findRoom
}