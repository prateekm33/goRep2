function removePeer(id, fromPeer) {
  const peers = [fromPeer];
  let peerIdx = 0;
  while (peerIdx < peers.length) {
    if (id in peers[peerIdx].peers) {
      return _removePeer(peers[peerIdx], id);
    }
    peers.push(...peers[peerIdx].peersArray);
    peerIdx++;
  }

  function _removePeer(peer, id) {
    const deletedPeer = peer.peers[id];
    delete peer.peers[id];
    const idx = peer.peersArray.indexOf(deletedPeer);
    peer.peersArray.splice(idx, 1);
    peer.numPeers--;
    return true;
  }
}

function findNextAvailablePeer(peer) {
  const peers = peer.peersArray.map(i => i);
  let i = 0;
  while (i < peers.length) {
    console.log('checking for valid peers...');
    peers.push(...peers[i].peersArray);
    if (peers[i].numPeers < peers[i].MAX_PEERS) return peers[i];
    i++;
  }

  return null;
}


module.exports = {
  removePeer,
  Peer,
  findNextAvailablePeer
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
    return this.socketID;
    // return n === 0 ? this.socketID : this.roomSocketID;
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
      return this.socketID;
      // return this.roomSocketID || this.socketID;
    }
  }

  contains(id) {
    return id in this.peers;
  }

  removePeer(id, fromPeer) {
    const peers = [fromPeer];
    let peerIdx = 0;
    while (peerIdx < peers.length) {
      if (id in peers[peerIdx].peers) {
        return _removePeer(peers[peerIdx], id);
      }
      peers.push(...peers[peerIdx].peersArray);
      peerIdx++;
    }

    function _removePeer(peer, id) {
      const deletedPeer = peer.peers[id];
      delete peer.peers[id];
      const idx = peer.peersArray.indexOf(deletedPeer);
      peer.peersArray.splice(idx, 1);
      peer.numPeers--;
      return true;
    }
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

// module.exports = Peer;