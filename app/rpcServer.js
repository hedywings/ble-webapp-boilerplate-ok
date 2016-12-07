var http = require('http');
var io = require('socket.io');

function start () {
	// 建立一個 HTTP Server 作為 RPC 用的 Server
    var server = http.createServer();

    server.listen(3030);

    // 建立 RPC Server 並回傳
    return io(server);
}

module.exports = start;