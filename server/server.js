const express = require('express');
const app = express();
const initMiddleWare = require('./initMiddleware.js');
console.log('__dirname: ', __dirname, process.env.PORT);

const PORT = process.env.PORT || 3000;

initMiddleWare(app);

require('./routes')(app);

const server = app.listen(PORT, () => {
  console.log("App listening on " + PORT);
});

require('./initSockets')(server);