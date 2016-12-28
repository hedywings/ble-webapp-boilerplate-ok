var BleShepherd = require('ble-shepherd');

function start () {
    // 新增一個 central 實例
    var central = new BleShepherd('noble');

    // 啟動 machine server 並回傳
    central.start();
    return central;
}

module.exports = start;