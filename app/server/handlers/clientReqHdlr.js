function clientReqHdlr (central, rpcServer, msg) {
    var args = msg.args,
        rspMsg = {
            seq: msg.seq,
            rspType: msg.reqType,
            status: null,
            data: {}
        };

    if (msg.reqType === 'permitJoin') {
        central.permitJoin(args.time);

        rspMsg.status = 0;
        rpcServer.emit('rsp', rspMsg);
    }

    if (msg.reqType === 'getDevs') {
        var devList = central.list(),
            devs = {};

        devList.forEach(function (devInfo) {
            devs[devInfo.addr] = central.find(devInfo.addr).dump();
        });

        rspMsg.status = 0;
        rspMsg.data.devs = devs;
        rpcServer.emit('rsp', rspMsg);
    }

    if (msg.reqType === 'write') {
        var dev = central.find(args.addr),
            sid = args.sid,
            cid = args.cid,
            value = args.value;

        if (dev)
            dev.write(sid, cid, value, function (err) {
                if (err) rspMsg.status = 1;
                else rspMsg.status = 0;

                rpcServer.emit('rsp', rspMsg);
            });    
    }
}

module.exports = clientReqHdlr;