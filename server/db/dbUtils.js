const broadcasters = {};
// const pool = require('./init').pool;
const { Room } = require('./schemas');

exports.findPeer = roomName => {
  return Room.findOne({ roomName })
    .then(room => room ? room.peer.socketID : null);

  // const findPeerQuery = "select streamer from rooms where name=($1)"
  // return pool.query(findPeerQuery, [roomName])
  //         .then(res => {
  //           console.log('findpeer res: ', res);
  //           return res;
  //         })
  //         .catch(err => {
  //           console.log('findpeer err: ', err);
  //           return err;
  //         })
}

exports.addRoom = (roomName, peer) => {
  const newRoom = new Room({ roomName, peer });
  return newRoom.save().then(room => {
    console.log('room saved : ', room);
    return room;
  }).catch(err => {
    console.log('error add room ', err);
    return err;
  });

  // return pool.query('insert into rooms (name, streamer) values (($1))', [`${roomName}, ${peer.socketID}`])
  //   .then(res => {
  //     pool.query('insert into users')
  //   })
  //   .catch(err => {
  //     console.log('add room err: ', err);
  //   });
}

exports.removeRoom = roomName => {
  return Room.findOne({ roomName })
    .then(room => room.remove());
}


exports.findRoom = roomName => {
  console.log("checking for room ", roomName);
  return Room.findOne({ roomName })
    .then(room => {
      console.log("room found? ", room);
      return room;
    })
    .catch(err => {
      console.log('find room error: ', err);
    })

  // return pool.query('select * from rooms where name=($1)', [roomName])
  //   .then(res => !!res.rowCount)
  //   .catch(err => {
  //     console.log('find room err: ', err);
  //   });
}