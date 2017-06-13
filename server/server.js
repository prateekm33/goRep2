const express = require('express');
const app = express();
const initMiddleWare = require('./initMiddleWare');

const PORT = 3000;

initMiddleWare(app);

require('./routes')(app);

const server = app.listen(PORT, () => {
  console.log("App listening on " + PORT);
});

require('./initSockets')(server);