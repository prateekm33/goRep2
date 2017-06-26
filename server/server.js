const express = require('express');
const app = express();
const config = require('./config.json');
const initMiddleWare = require('./initMiddleware.js');

const PORT = process.env.PORT || 3000;

initMiddleWare(app);
require('./routes')(app);


switch (config.db) {
  case 'mongo': {
    const db = require('./db/init');
    const server = app.listen(PORT, () => {
      console.log("App listening on " + PORT);
    });

    require('./initSockets')(server);
  }

  case 'sequelize': {
    const initDb = require('./db/init').initDb;
    initDb({ forceSync: true })
      .then(sequelize => {
        const server = app.listen(PORT, () => {
          console.log("App listening on " + PORT);
        });
        require('./initSockets')(server);
      })
      .catch(err => {
        console.log("Error setting up db: ", err);
      });
  }
}
    // // ***Uncomment below section for Postgres pg configuration***
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