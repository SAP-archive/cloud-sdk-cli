describe('Sample integration tests', () => {
  const https = require('http');
  const server = require('../../app.js');
  const port = 3000;
  let serverInstance;

  beforeAll(function(){
    serverInstance = server.listen(port, () => console.log(`Example app listening on port ${port}!`))
  });

  afterAll(async function () {
    serverInstance.close()
  });

  it('should start a server with one endpoint',  (done) => {
    https.get({ host: 'localhost', port: port, path: '/' }, (res) => {
      expect(res.statusCode).toBe(200);
      done()
    });
  })
});
