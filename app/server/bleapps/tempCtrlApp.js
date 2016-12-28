var sivannRelayPlugin = require('bshep-plugin-sivann-relay');
var sivannWeatherPlugin = require('bshep-plugin-sivann-weatherstation');

var ThingsSpeakClient = require('thingspeakclient');
var client = new ThingsSpeakClient();

client.attachChannel(201297, {
	writeKey: '15Y9NU0EGDNHPEFF',
	readKey: 'AO9CECRWCRUSAJSJ'
});

var relay, weatherStation;

function tempCtrlApp (central) {
	central.support('sivannRelay', sivannRelayPlugin);
	central.support('sivannWeather', sivannWeatherPlugin);

	var blocker = central.blocker;

	blocker.enable('white');
	blocker.unblock('0xd05fb820ceef');
	blocker.unblock('0x20c38ff19403');

	central.on('ind', function (msg) {
		var dev = msg.periph;

		switch(msg.type) {
			case 'devIncoming':
				if (dev.name === 'sivannRelay') {
					relay = dev;
				}
				if (dev.name === 'sivannWeather') {
					weatherStation = dev;

					weatherStation.configNotify('0xbb80', '0xcc07', true, function (err) {
						// if (!err)
						// 	// console.log('Temperature report setting success');
					});

					weatherStation.onNotified('0xbb80', '0xcc07', tempChangeHdlr);

					setInterval(function () {
						var tempCharInfo = weatherStation.dump('0xbb80', '0xcc07'),
							tempValue = tempCharInfo.value.sensorValue;

						if (weatherStation.dump().status !== 'online') return;

						client.updateChannel(
							201297,
							{ field1: tempValue },
							function (err, resp) {
								
							}
						);
					}, 15000);
				}
				break;	
		}
	});
}

function tempChangeHdlr (data) {
	if (!relay) return;

	var relayValue = relay.dump('0xbb40', '0xcc0e').value;

	if (data.sensorValue > 28) {
		relayValue.onOff = true;
		relay.write('0xbb40', '0xcc0e', relayValue);
	} else if (data.sensorValue < 26) {
		relayValue.onOff = false;
		relay.write('0xbb40', '0xcc0e', relayValue);
	}
}
module.exports = tempCtrlApp;
