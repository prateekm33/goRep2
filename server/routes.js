// import route modules here


module.exports = app => {
  // app.use('/home', homeRoutes);

  app.use('/streams', (req, res) => {
    console.log(req.body);
    res.end();
  })

  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'client' });
  });
}