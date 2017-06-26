const express = require('express');
const app = express();
const initMiddleWare = require('./initMiddleware.js');

const PORT = process.env.PORT || 3000;

initMiddleWare(app);
require('./routes')(app);

const db = require('./db/init');
const server = app.listen(PORT, () => {
  console.log("App listening on " + PORT);
});

require('./initSockets')(server);


// db.initPool()
//   .then(query => {
//     const server = app.listen(PORT, () => {
//       console.log("App listening on " + PORT);
//     });

//     require('./initSockets')(server);
//   })
//   .catch(err => {
//     console.log('error with pool connections...', err);
//   });










