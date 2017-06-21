const streamsRouter = require('express').Router();
const dbUtils = require('./dbUtils');

streamsRouter.route('/:roomName')
  .get((req, res) => {

    dbUtils.findRoom(req.params.roomName)
      .then(room => {
        console.log("did we find a room?", !!room);
        res.json({ room: !!room })
      })
      .catch(err => res.json({ err }));
  })

streamsRouter.route('/auth/:roomName')
  .post((req, res) => {
    console.log("password: ", req.body.pw);

    dbUtils.findRoom(req.params.roomName)
      .then(room => {
        res.json({ ok: room.password === req.body.pw})
      })
      .catch(err => {
        console.log("error finding room...", err);
        res.json({ err });
      })
  })

module.exports = streamsRouter;