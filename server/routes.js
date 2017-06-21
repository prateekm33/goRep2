// import route modules here
const streamsRouter = require('./streamsRouter');

module.exports = app => {
  // app.use('/home', homeRoutes);

  app.use('/streams', streamsRouter);

  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'client' });
  });
}