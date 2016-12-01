var path = require('path');
var fs = require('fs');
var chalk = require('chalk');

var BleShepherd = require('ble-shepherd');
var startHttpServer = require('./servers/httpServer');
var startRpcServer = require('./servers/rpcServer');

var central = new BleShepherd('noble');

var rpcServer,
    httpServer;

function start () {
    var dbPath = path.resolve(__dirname, '../node_modules/ble-shepherd/lib/database/ble.db');
    fs.exists(dbPath, function (isThere) {
        if (isThere) { fs.unlink(dbPath); }
    });

    central.start(function (err) {
        if (err)
            throw err;

        showWelcomeMsg();
        setLeaveMsg();

        rpcServer = startRpcServer();
        httpServer = startHttpServer();

        // rpcServer
        rpcServer.on('connection', function (socket) {
            socket.on('req', clientReqHdlr);
        });
    });

    central.on('error', errorEvtHdlr);
    central.on('permitJoining', permitJoiningEvtHdlr);
    central.on('ind', indEvtHdlr);
}


/**********************************************/
/* RPC Client Request Handler                 */
/**********************************************/
function clientReqHdlr (msg) {
    var args = msg.args;

    switch (msg.reqType) {
        case 'permitJoin':
            central.permitJoin(args.time);
            break;

        case 'write':
            var dev = central.find(args.permAddr),
                uuids = args.auxId.split('.'),
                sid = uuids[0],
                cid = uuids[1];

            dev.write(sid, cid, args.value);
            break;
    }
}

/**********************************************/
/* Machine Server Event Handler               */
/**********************************************/
function errorEvtHdlr (err) {
    console.log(chalk.red('[         error ] ') + err.message);
    rpcServer.emit('error', { msg: err.message });
}

function permitJoiningEvtHdlr (timeLeft) {
    console.log(chalk.green('[ permitJoining ] ') + timeLeft + ' sec');
    rpcServer.emit('ind', { 
        indType: 'permitJoining', 
        data: timeLeft
    });
}

function indEvtHdlr (msg) {
    var dev = msg.periph,
        devInfo = dev.dump();

    switch (msg.type) {
        case 'devIncoming':
            devIncomingHdlr(devInfo);
            break;

        case 'devStatus':
            devStatusHdlr(devInfo);
            break;

        case 'attChange':
            attChangeHdlr(devInfo, msg.data);
            break;
    }
}

/**********************************************/
/* Peripheral Event Handler               */
/**********************************************/
function devIncomingHdlr (devInfo) {
    rpcServer.emit('ind', {
        indType: 'devIncoming',
        data: devInfo
    });
}

function devStatusHdlr (devInfo) {
    if (devInfo.status === 'disc') return;

    rpcServer.emit('ind', {
        indType: 'devStatus',
        data: devInfo
    });
} 

function attChangeHdlr (devInfo, charInfo) {
    rpcServer.emit('ind', {
        indType: 'attChange',
        data: {
            devInfo: devInfo,
            charInfo: charInfo
        }
    });
}

/**********************************/
/* welcome function               */
/**********************************/
function showWelcomeMsg() {
var blePart1 = chalk.blue('       ___   __    ____      ____ __ __ ____ ___   __ __ ____ ___   ___ '),
    blePart2 = chalk.blue('      / _ ) / /   / __/____ / __// // // __// _ \\ / // // __// _ \\ / _ \\'),
    blePart3 = chalk.blue('     / _  |/ /__ / _/ /___/_\\ \\ / _  // _/ / ___// _  // _/ / , _// // /'),
    blePart4 = chalk.blue('    /____//____//___/     /___//_//_//___//_/   /_//_//___//_/|_|/____/ ');

    console.log('');
    console.log('');
    console.log('Welcome to ble-shepherd webapp... ');
    console.log('');
    console.log(blePart1);
    console.log(blePart2);
    console.log(blePart3);
    console.log(blePart4);
    console.log(chalk.gray('         A network server and manager for the BLE machine network'));
    console.log('');
    console.log('   >>> Author:     Hedy Wang (hedywings@gmail.com)');
    console.log('   >>> Version:    ble-shepherd v1.0.0');
    console.log('   >>> Document:   https://github.com/bluetoother/ble-shepherd');
    console.log('   >>> Copyright (c) 2016 Hedy Wang, The MIT License (MIT)');
    console.log('');
    console.log('The server is up and running, press Ctrl+C to stop server.');
    console.log('');
    console.log('---------------------------------------------------------------');
}

/**********************************/
/* goodBye function               */
/**********************************/
function setLeaveMsg() {
    process.stdin.resume();

    function showLeaveMessage() {
        console.log(' ');
        console.log(chalk.blue('      _____              __      __                  '));
        console.log(chalk.blue('     / ___/ __  ___  ___/ /____ / /  __ __ ___       '));
        console.log(chalk.blue('    / (_ // _ \\/ _ \\/ _  //___// _ \\/ // // -_)   '));
        console.log(chalk.blue('    \\___/ \\___/\\___/\\_,_/     /_.__/\\_, / \\__/ '));
        console.log(chalk.blue('                                   /___/             '));
        console.log(' ');
        console.log('    >>> This is a simple demonstration of how the shepherd works.');
        console.log('    >>> Please visit the link to know more about this project:   ');
        console.log('    >>>   ' + chalk.yellow('https://github.com/bluetoother/ble-shepherd'));
        console.log(' ');
        process.exit();
    }

    process.on('SIGINT', showLeaveMessage);
}



module.exports = start;