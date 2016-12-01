var http = require('http');
var io = require('socket.io');

function start () {
    var server = http.createServer();

    server.listen(3030);
    return io(server);
}

module.exports = start;