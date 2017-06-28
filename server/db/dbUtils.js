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
              // console.log('found peer? ', _peer);
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
        console.log("[findInitiator] Room???", room.peer);
        if (!room) { /* err */ return; }
        return Peer.findOne({
          where: { socketID : room.peer },
        }).then(peer => peer ? peer : null)
      });
    }
  }
}

const addPeer = (roomName, newPeerID, connectToPeer) => {
  console.log("[addPeer] CONNECT TO PEER : ", connectToPeer);

  const promise = connectToPeer ? 
    Peer.findOne({ where: { socketID: connectToPeer } }) : 
    findNextAvailable(roomName);

  return promise.then(NAP => {
    if (!NAP || NAP.numPeers >= MAX_PEERS) {
      console.log('[addPeer error] NAP dne or numPeers high : ', NAP ? NAP.numPeers : null);
      return null;
    }

    return Peer.findOne({
      where: { socketID: newPeerID }
    }).then(currPeer => {
      if (!currPeer) {
        return Peer.create(makePeer({
          roomName,
          socketID: newPeerID,
          parentPeer: NAP.socketID
        }));
      }

      return currPeer.update({ parentPeer: NAP.socketID });
    }).then(currPeer => NAP.update({ numPeers: NAP.numPeers + 1 }));
  }).catch(err => {
    console.log("[addPeer error] error : ", err);
    return err;
  });


  // return promise
    // .then(peer => {
    //   console.log("[addPeer] peer? ", peer.socketID);
    //   if (!peer) { /* err */ return null; }
    //   return Peer.findOne({
    //     where: { socketID: newPeerID }
    //   }).then(p => {
    //     if (!p) {
    //       return Peer.create(makePeer({
    //         roomName,
    //         socketID: newPeerID,
    //         parentPeer: peer.socketID
    //       }));
    //     }

    //     return p.update({ parentPeer: peer.socketID })
    //   }).then(saved => {
    //     return peer.update({ numPeers: peer.numPeers + 1});
    //   });
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
}

const addRoom = (roomName, peer) => {

  switch (config.db) {
    case 'mongo': {
      const newPeer = makePeer(peer);

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
      console.log("[addRoom] adding room : ", roomName);
      return Peer.create(makePeer(peer)).then(room => Room.create({roomName, 
        peer: peer.socketID,
        group: 0
      }))
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
  // find this peer in db
  return Peer.findOne({
    where: { socketID }
  }).then(peer => {
    if (!peer) return null;
    // destroy this peer
    return peer.destroy().then(() => {
      // find this peer's parent peer
      return Peer.findOne({
        where: { socketID: peer.parentPeer }
      });
    });
    // update the parent peer's numPeers
  }).then(parentPeer => parentPeer.update({
    numPeers: parentPeer.numPeers - 1
  })).then(updated => {
    // find next available
    console.log('--- updated roomName : ', updated.roomName)
    return findNextAvailable(updated.roomName).then(NAP => NAP);
  });

  // return Peer.destroy({
  //   where: { socketID }
  // }).then(destroyedPeer => {
  //   console.log("[removePeer] destroyedPeer ? ", destroyedPeer);
  //   if (!destroyedPeer) return null;
  //   console.log("UPDATING PARENT PEER TO DESTROYED PEER");
  //   return Peer.findOne({
  //     where: { socketID: destroyedPeer.parentPeer }
  //   })
  // }).then(peer => peer ? peer.update({ numPeers: peer.numPeers - 1 }) : null)
}


const findRoom = roomName => {
  switch (config.db) {
    case 'mongo': {
      console.log("checking for room ", roomName);
      return Room.findOne({ roomName })
        .then(room => {
          // console.log("room found? ", room);
          return room;
        })
        .catch(err => {
          // console.log('find room error: ', err);
        });
    }

    case 'sequelize': {
      console.log("checking for room sequelize...")
      // *** postgres sequelize config ***
      return Room.findOne({
        where: { roomName }
      }).then(room => {
        console.log("[findRoom] room found? ", !!room);
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