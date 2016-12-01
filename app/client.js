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

    permitJoiningHdlr: function (timeLeft) {
        this.setState({
            timeLeft: timeLeft
        });
    },

    devIncomingHdlr: function (devInfo) {
        this.setState({
            devs: { 
                ...this.state.devs, 
                [devInfo.addr]: devInfo
            }
        });
    },

    devStatusHdlr: function (devInfo) {
        this.setState({
            devs: {
                ...this.state.devs,
                [devInfo.addr]: {
                    ...this.state.devs[devInfo.addr],
                    status: devInfo.status
                }
            }
        });
    },

    attChangeHdlr: function (devInfo, charInfo) {
        console.log(charInfo);
        this.setState({
            devs: {
                ...this.state.devs,
                [devInfo.addr]: devInfo
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
                    self.attChangeHdlr(data.devInfo, data.charInfo);
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

    onWriteCallback: function (permAddr, sid, cid, value) {
        return function () {
            var args = {
                reqType: 'permitJoin',
                args: {
                    permAddr: permAddr,
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