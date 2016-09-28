var finalhandler = require('finalhandler')
  , http = require('http')
  , serveStatic = require('serve-static')

var serve = serveStatic('dev', {'index': ['index.html', 'index.htm']})

var server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})

console.info('Latino is running at http://localhost:3000/. Press Ctrl+C to stop.')
server.listen(3000)