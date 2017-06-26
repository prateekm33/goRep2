const mongoose = require("mongoose");
const mongoUri = 'mongodb://localhost/quikstreams';
mongoose.connect(mongoUri);
const db = mongoose.connection;
module.exports = db;


// const pg = require('pg');

// const config = {
//   user: 'qstream', //env var: PGUSER 
//   database: 'quikstreams', //env var: PGDATABASE 
//   password: 'secret', //env var: PGPASSWORD 
//   host: 'localhost', // Server hosting the postgres database 
//   port: 5432, //env var: PGPORT 
//   max: 10, // max number of clients in the pool 
//   idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
// }


// const pool = new pg.Pool(config);

// module.exports.pool = pool;
// module.exports.initPool = () => {
//   const createRoomsQuery = 'CREATE TABLE IF NOT EXISTS rooms(name text NOT NULL PRIMARY KEY, streamer text NOT NULL)';
//   const createUsersQuery = 'CREATE TABLE IF NOT EXISTS users(socketID text NOT NULL,parentID text,room text REFERENCES rooms(name))';
//   return pool.query(createRoomsQuery)
//           .then(() => {
//             return pool.query(createUsersQuery);
//           });
// }