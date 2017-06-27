const config = require('../config.json');

switch (config.db) {
  case 'mongo': {
    const mongoose = require("mongoose");
    const mongoUri = 'mongodb://localhost/quikstreams';
    mongoose.connect(mongoUri);
    const db = mongoose.connection;
    module.exports = db;
  }

  case 'sequelize': {
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize('quikstreams', 'qstream', 'secret', {
      host: process.env.NODE_ENV === 'prod' ? config.sequelize.hostname.prod : config.sequelize.hostname.dev,
      dialect: 'postgres',
      pool: {
        max: 5,
        min: 0,
        idle: 10000
      }
    });

    const Peer = sequelize.define('peer', {
      roomName: { type: Sequelize.STRING },
      socketID: { type: Sequelize.STRING, primaryKey: true },
      MAX_PEERS: { type: Sequelize.INTEGER },
      numPeers: { type: Sequelize.INTEGER },
      parentPeer: { type: Sequelize.STRING },
      peersArray: { type: Sequelize.ARRAY(Sequelize.JSON) },
      peers: { type: Sequelize.JSON }
    });

    const Room = sequelize.define('room', {
      roomName: { type: Sequelize.STRING, primaryKey: true },
      group: { type: Sequelize.INTEGER },
      peer: { 
        type: Sequelize.STRING,
        references: {
          model: Peer,
          key: 'socketID',
          deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
      }
    });

    module.exports.initDb = ({forceSync}) => {
      return Peer.sync({ force: forceSync })
        .then(() => Room.sync({ force: forceSync }))
        .then(models => sequelize.authenticate());
    }

    module.exports.Room = Room;
    module.exports.Peer = Peer;
  }

}
  // case 'pg': {
  //   const pg = require('pg');

  //   const config = {
  //     user: 'qstream', //env var: PGUSER 
  //     database: 'quikstreams', //env var: PGDATABASE 
  //     password: 'secret', //env var: PGPASSWORD 
  //     host: 'localhost', // Server hosting the postgres database 
  //     port: 5432, //env var: PGPORT 
  //     max: 10, // max number of clients in the pool 
  //     idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  //   }


  //   const pool = new pg.Pool(config);

  //   module.exports.pool = pool;
  //   module.exports.initPool = () => {
  //     const createRoomsQuery = 'CREATE TABLE IF NOT EXISTS rooms(name text NOT NULL PRIMARY KEY, streamer text NOT NULL)';
  //     const createUsersQuery = 'CREATE TABLE IF NOT EXISTS users(socketID text NOT NULL,parentID text,room text REFERENCES rooms(name))';
  //     return pool.query(createRoomsQuery)
  //             .then(() => {
  //               return pool.query(createUsersQuery);
  //             });
  //   }
  // }