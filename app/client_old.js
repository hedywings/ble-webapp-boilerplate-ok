import request from 'superagent';
import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';

import ioClient from './helpers/ioClient';

import NavBar from './components/NavBar/NavBar';
import CardBlock from './components/CardBlock/CardBlock';

var title = 'ble-shepherd',
    permitJoinTime = 60;

ioClient.start('http://' + window.location.hostname + ':3030');

/*********************************************/
/* Private Functions                         */
/*********************************************/
function ioConnectedDelay (callback) {
    if (ioClient._connected) {
        callback();
    } else {
        setTimeout(function () {
            ioConnectedDelay(callback);
        }, 1000);
    }
}

/*********************************************/
/* App component                             */
/*********************************************/
var App = React.createClass({
    getInitialState: function () {
        return {
            devs: {},
            timeLeft: 0
        };
    },

    componentDidMount: function () {
        var self = this;

        ioConnectedDelay(function () {
            ioClient.sendReq('getDevs', {}, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    self.setState({
                        devs: data
                    });
                } 
            });
        });

        ioClient.on('permitJoining', function (msg) {
            // msg = { timeLeft }
            self.setState({
                timeLeft: msg.timeLeft
            });
        });

        ioClient.on('devIncoming', function (msg) {
            // msg =  { dev }
            self.setState({
                devs: { ...self.state.devs, [msg.dev.permAddr]: msg.dev}
            });
        });

        ioClient.on('devStatus', function (msg) {
            // msg = { permAddr, status }
            self.setState({
                devs: {
                    ...self.state.devs,
                    [msg.permAddr]: {
                        ...self.state.devs[msg.permAddr],
                        status: msg.status
                    }
                }
            });
        });

        ioClient.on('attrsChange', function (msg) {
            // msg = { permAddr, gad } 
            self.setState({
                devs: {
                    ...self.state.devs,
                    [msg.permAddr]: {
                        ...self.state.devs[msg.permAddr],
                        gads: {
                            ...self.state.devs[msg.permAddr].gads,
                            [msg.gad.auxId]: msg.gad
                        }
                    }
                }
            });
        });
    },

    onPermitCallback: function () {
        ioConnectedDelay(function () {
            ioClient.sendReq('permitJoin', { time: permitJoinTime }, function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        });
    },

    onWriteCallback: function (permAddr, auxId, value) {
        return function () {
            ioConnectedDelay(function () {
                var args = { permAddr: permAddr, auxId: auxId, value: value };
                ioClient.sendReq('write', args, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        };
    },

    render: function () {
        return (
            <MuiThemeProvider>
                <div>
                    <NavBar title={this.props.title} timeLeft={this.state.timeLeft} onClick={this.onPermitCallback} />
                    <CardBlock devs={this.state.devs} onClick={this.onWriteCallback}/>
                </div>     
            </MuiThemeProvider>
        );
    }
});

/*********************************************/
/* render                                    */
/*********************************************/
ReactDOM.render(<App title={title} />, document.getElementById('root'));
