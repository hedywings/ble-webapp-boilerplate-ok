var path = require('path');
var fs = require('fs');
var chalk = require('chalk');

// Machine Server 啟動函式
var startMachineServer = require('./services/machineServer');
// RPC Server 啟動函式
var startRpcServer = require('./services/rpcServer');
// HTTP Server 啟動函式
var startHttpServer = require('./services/httpServer');

// Client Request Handler
var clientReqHdlr = require('./handlers/clientReqHdlr');
// BLE Machine Network Handlers
var bleEvtHdlrs = require('./handlers/bleEvtHdlrs');

// 載入溫控系統應用
var tempCtrlApp = require('./bleapps/tempCtrlApp');

var central,
    rpcServer,
    httpServer;

function start () {
    var dbPath = path.resolve(__dirname, '../../node_modules/ble-shepherd/lib/database/ble.db');
    fs.exists(dbPath, function (isThere) {
        if (isThere) { fs.unlink(dbPath); }
    });

    showWelcomeMsg();
    setLeaveMsg();

    // 依序啟動 Machine Server, RPC Server 和 HTTP Server
    central = startMachineServer();
    central.on('ready', function () {
        // 啟動溫控系統應用
        tempCtrlApp(central);

        rpcServer = startRpcServer ();   // RPC Server
        httpServer = startHttpServer (); // HTTP Server

        // Web Server 啟動之後，開始會有 socket 連入，監聽 'connection' 事件  
        rpcServer.on('connection', function (socket) {
            socket.on('req', function (msg) {
                clientReqHdlr(central, rpcServer, msg);
            });
        });
    });

    // 需要轉接 Machine Server 的事件至 Web Client 端
    central.on('error', function (msg) {
        bleEvtHdlrs.error(rpcServer, msg);
    });
    central.on('permitJoining', function (msg) {
        bleEvtHdlrs.permitJoining(rpcServer, msg);
    });
    central.on('ind', function (msg) {
        bleEvtHdlrs.ind(rpcServer, msg);
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