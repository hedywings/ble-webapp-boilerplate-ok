var chalk = require('chalk'),
    bipso = require('bipso');

var bleEvtHdlrs = {
    error: errorEvtHdlr,
    permitJoining: permitJoiningEvtHdlr,
    ind: indEvtHdlr
};

/**********************************************/
/* BLE Machine Server Event Handler           */
/**********************************************/
function errorEvtHdlr (rpcServer, err) {
    console.log(chalk.red('[         error ] ') + err.message);
    rpcServer.emit('error', { msg: err.message });
}

// 轉發 permitJoining 事件至 Web Client 端
function permitJoiningEvtHdlr (rpcServer, timeLeft) {
    console.log(chalk.green('[ permitJoining ] ') + timeLeft + ' sec');

    rpcServer.emit('ind', { 
        indType: 'permitJoining', 
        data: {
            timeLeft: timeLeft
        }
    });
}

// ind 事件為周邊裝置相關的所有事件，使用分派器處理
function indEvtHdlr (rpcServer, msg) {
    var dev = msg.periph,
        devInfo = dev.dump();

    switch (msg.type) {
        case 'devIncoming':
            devIncomingHdlr(rpcServer, devInfo);
            break;

        case 'devStatus':
            devStatusHdlr(rpcServer, devInfo, msg.data);
            break;

        case 'attChange':
            attChangeHdlr(rpcServer, devInfo, msg.data);
            break;
    }
}

/**********************************************/
/* Peripheral Event Handler                   */
/**********************************************/
function devIncomingHdlr (rpcServer, devInfo) {
    console.log(chalk.yellow('[   devIncoming ] ') + '@' + devInfo.addr);

    rpcServer.emit('ind', {
        indType: 'devIncoming',
        data: {
            devInfo: devInfo
        }
    });
}

function devStatusHdlr (rpcServer, devInfo, status) {
    if (status === 'online')
        status = chalk.green(status);
    else 
        status = chalk.red(status);

    console.log(chalk.magenta('[     devStatus ] ') + '@' + devInfo.addr + ', ' + status);

    if (devInfo.status === 'disc') return;

    rpcServer.emit('ind', {
        indType: 'devStatus',
        data: { 
            devInfo: devInfo
        }
    });
} 

function attChangeHdlr (rpcServer, devInfo, charInfo) {
    var oid = bipso.uo(charInfo.cid.uuid),
        value;

    if (oid === 'temperature') value = charInfo.value.sensorValue.toFixed(2);
    if (oid === 'pwrCtrl') value = charInfo.value.onOff;
    if (value !== undefined)
        console.log(chalk.blue('[   attrsChange ] ') + '@' + devInfo.addr + 
            ', type: ' + oid + ', value: ' + value);
    
    rpcServer.emit('ind', {
        indType: 'attChange',
        data: {
            devInfo: devInfo
        }
    });
}

module.exports = bleEvtHdlrs;
