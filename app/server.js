var http = require('http');
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var _ = require('busyman');
var BleShepherd = require('ble-shepherd');

var ioServer = require('./helpers/ioServer');
var tempCtrlApp = require('./tempCtrlApp');

var central = new BleShepherd('noble'); 
var server = http.createServer();

server.listen(3030);
ioServer.start(server);

var relay, weatherStation;

function serverApp () {
    // show Welcome Msg               
    showWelcomeMsg();

    // set Leave Msg
    setLeaveMsg();

    // register Req handler
    ioServer.regReqHdlr('getDevs', function (args, cb) { 
        var devs = {};

        _.forEach(central.list(), function (devInfo) {
            devs[devInfo.addr] = cookRawDev(central.find(devInfo.addr));
        });

        cb(null, devs);
    });

    ioServer.regReqHdlr('permitJoin', function (args, cb) { 
        central.permitJoin(args.time);
        cb(null, args);
    });

    ioServer.regReqHdlr('write', function (args, cb) { 
        var dev = central.find(args.permAddr),
            uuids = args.auxId.split('.'),
            sid = uuids[0],
            cid = uuids[1],
            charRec = dev.dump(sid, cid);

        charRec.value[getGadProp(charRec).valueName] = args.value;

        dev.write(sid, cid, charRec.value, function (err) {
            if (err)
                cb(err);
            else
                cb(null, args.value);
        });
    });

    // start ble-shepherd
    var dbPath = path.resolve(__dirname, '../node_modules/ble-shepherd/lib/database/ble.db');
    fs.exists(dbPath, function (isThere) {
        if (isThere) { fs.unlink(dbPath); }
    });

    central.start(); 

    // event listeners
    central.on('ready', function () {
        tempCtrlApp(central);
        readyInd();
    });

    central.on('permitJoining', function (timeLeft) {
        permitJoiningInd(timeLeft);
    });

    central.on('error', function (err) {
        errorInd(err.message);
    });

    central.on('ind', function (msg) {
        var dev = msg.periph;

        switch (msg.type) {
            /*** devIncoming      ***/
            case 'devIncoming':
                devIncomingInd(cookRawDev(dev));
                break;

            /*** devStatus        ***/
            case 'devStatus':
                console.log('xxxxxxxxxxxxxxxxxxxxxxx ' + dev.status);
                devStatusInd(dev.addr, msg.data);
                break;

            /*** attrsChange      ***/
            case 'attChange':
                var sid = msg.data.sid,
                    cid = msg.data.cid,
                    charRec = dev.dump(sid.uuid, cid.handle),
                    gad = cookRawGad(charRec, sid.uuid);

                if (!gad) return;
         
                valueName = getGadProp(charRec).valueName;

                if (!_.isNil(valueName) && !_.isNil(msg.data.value[valueName])) 
                    attrsChangeInd(dev.addr, cookRawGad(charRec, sid.uuid));
                
                break;
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

/**********************************/
/* Indication funciton            */
/**********************************/
function readyInd () {
    ioServer.sendInd('ready', {});
    console.log(chalk.green('[         ready ] '));
}

function permitJoiningInd (timeLeft) {
    ioServer.sendInd('permitJoining', { timeLeft: timeLeft });
    console.log(chalk.green('[ permitJoining ] ') + timeLeft + ' sec');
}

function errorInd (msg) {
    ioServer.sendInd('error', { msg: msg });
    console.log(chalk.red('[         error ] ') + msg);
}

function devIncomingInd (dev) {
     ioServer.sendInd('devIncoming', { dev: dev });
    console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.permAddr);
}

function devStatusInd (permAddr, status) {
    ioServer.sendInd('devStatus', { permAddr: permAddr, status: status });

    if (status === 'online')
        status = chalk.green(status);
    else 
        status = chalk.red(status);

    console.log(chalk.magenta('[     devStatus ] ') + '@' + permAddr + ', ' + status);
}

function attrsChangeInd (permAddr, gad) {
    ioServer.sendInd('attrsChange', { permAddr: permAddr, gad: gad });
    console.log(chalk.blue('[   attrsChange ] ') + '@' + permAddr + ', auxId: ' + gad.auxId + ', value: ' + gad.value);
}


/**********************************/
/* Cook funciton                  */
/**********************************/
function cookRawDev (dev) {
    var devRec = dev.dump(),
        cooked = {
            permAddr: devRec.addr,
            status: devRec.status,
            gads: {}
        };

    _.forEach(devRec.servList, function (servRec) {
        _.forEach(servRec.charList, function (charRec) {
            var cookedGad = cookRawGad(charRec, servRec.uuid);

            if (!_.isNil(cookedGad)) {
                cooked.gads[cookedGad.auxId] = cookedGad;
                dev.configNotify(servRec.uuid, charRec.uuid, true);
            }
        });
    });

    return cooked;
}

function cookRawGad (charRec, servUuid) {
    var cooked = {
            type: null,
            auxId: null,
            value: null
        },
        gadInfo = getGadProp(charRec),
        gadValue;

    if (!gadInfo) return;

    gadValue = charRec.value[gadInfo.valueName];

    if (_.isNumber(gadValue))
        gadValue = gadValue.toFixed(3);

    cooked.type = gadInfo.name;
    cooked.auxId = servUuid + '.' + 
                   charRec.uuid;
    cooked.value = gadValue;

    return cooked;
}

function getGadProp (charRec) {
    var gadProp = {
            name: null,
            valueName: null
        };

    switch (charRec.uuid) {
        case '0xcc07':
            gadProp.name = 'Temperature';
            gadProp.valueName = 'sensorValue';
            break;
        case '0xcc0e':
            gadProp.name = 'Plug';
            gadProp.valueName = 'onOff';
            break;

        default:
            return;
    }

    return gadProp;
}

module.exports = serverApp;