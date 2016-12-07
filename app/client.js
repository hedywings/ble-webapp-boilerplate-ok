import request from 'superagent';
import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import io from 'socket.io-client';

import NavBar from './components/NavBar/NavBar';
import CardBlock from './components/CardBlock/CardBlock';

var title = 'ble-shepherd',
    permitJoinTime = 60;

var rpcClient = io('http://' + window.location.hostname + ':3030');


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

    permitJoiningHdlr: function (data) {
        this.setState({
            timeLeft: data.timeLeft
        });
    },

    devIncomingHdlr: function (data) {
        this.setState({
            devs: { 
                ...this.state.devs, 
                [data.devInfo.addr]: data.devInfo
            }
        });
    },

    devStatusHdlr: function (data) {
        this.setState({
            devs: {
                ...this.state.devs,
                [data.devInfo.addr]: {
                    ...this.state.devs[data.devInfo.addr],
                    status: data.status
                }
            }
        });
    },

    attChangeHdlr: function (data) {
        var dev = Object.assign({}, this.state.devs[data.devInfo.addr]);
            
        for (var i = 0; i < dev.servList; i += 1) {
            var servInfo = dev.servList[i];
            if (servInfo.handle === data.charInfo.sid.handle) {
                for(var j = 0; j < servInfo.charList; j += 1) {
                    var charInfo = servInfo.charList[j];
                    if (charInfo.handle === data.charInfo.cid.handle)
                        charInfo.value = data.charInfo.cid.value;
                }
            }
        }

        this.setState({
            devs: {
                ...this.state.devs,
                [data.devInfo.addr]: data.devInfo
            }
        });
    },

    componentDidMount: function () {
        var self = this;

        rpcClient.on('ind', function (msg) {
            var data = msg.data;

            switch (msg.indType) {
                case 'permitJoining':
                    self.permitJoiningHdlr(data);
                    break;
                case 'devIncoming':
                    self.devIncomingHdlr(data);
                    break;
                case 'devStatus':
                    self.devStatusHdlr(data);
                    break;
                case 'attChange':
                    self.attChangeHdlr(data);
                    break;
            }
        });
    },

    onPermitCallback: function () {
        var msg = {
                reqType: 'permitJoin',
                args: {
                    time: permitJoinTime
                }
            };

        rpcClient.emit('req', msg);
    },

    onWriteCallback: function (addr, sid, cid, value) {
        return function () {
            var msg = {
                    reqType: 'write',
                    args: {
                        addr: addr,
                        sid: sid,
                        cid: cid,
                        value: value
                    }
                };

            rpcClient.emit('req', msg);
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