const broadcasters = {};

exports.findPeer = roomName => {
  return Promise.resolve(broadcasters[roomName]);
}

exports.addRoom = (roomName, peer) => {
  broadcasters[roomName] = peer;
  return Promise.resolve();
}

exports.removeRoom = roomName => {
  delete broadcasters[roomName];
  return Promise.resolve();
}


exports.findRoom = roomName => {
  console.log("checking for room ", roomName);
  return Promise.resolve(broadcasters[roomName]);
}