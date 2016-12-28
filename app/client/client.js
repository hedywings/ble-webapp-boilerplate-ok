import request from 'superagent';
import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import io from 'socket.io-client';
import injectTapEventPlugin from 'react-tap-event-plugin';
import EventEmitter from 'events';

import NavBar from './components/NavBar/NavBar';
import CardBlock from './components/CardBlock/CardBlock';

var title = 'ble-shepherd',
    permitJoinTime = 60,
    internalEmitter = new EventEmitter();

var rpcClient = io('http://' + window.location.hostname + ':3030');

injectTapEventPlugin();
/*********************************************/
/* App component                             */
/*********************************************/
var App = React.createClass({
    getInitialState: function () {
        return {
            devs: {},
            timeLeft: 0,
            seqNum: 0
        };
    },

    nextSeqNum: function () {
        if (this.state.seqNum > 255)
            this.setState({
                seqNum: 0
            });

        return this.state.seqNum++;
    },

    getDevs: function () {
        var self = this,
            msg = {
                seq: this.nextSeqNum(),
                reqType: 'getDevs',
                args: {}
            },
            rspEvtName = msg.reqType + ':' + msg.seq;

        internalEmitter.once(rspEvtName, function (status, data) {
            if (status !== 0)
                alert('An error occurred with the getDevs command.');
            else
                self.setState({
                    devs: data.devs
                });
        });
        rpcClient.emit('req', msg);
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
                [data.devInfo.addr]: data.devInfo
            }
        });
    },

    attChangeHdlr: function (data) {        
        this.setState({
            devs: {
                ...this.state.devs,
                [data.devInfo.addr]: data.devInfo
            }
        });
    },    

    componentDidMount: function () {
        var self = this;

        // 監聽 server 發射的 rsp 事件
        rpcClient.on('rsp', function (msg) {
            var evtName = msg.rspType + ':' + msg.seq;

            internalEmitter.emit(evtName, msg.status, msg.data);
        });

        // 監聽 server 發射的 ind 事件，並使用分派器處理
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

        // 每次網頁刷新時向 server 端取得所有裝置資料
        this.getDevs();
    },

    // 需傳入 PERMITJOIN 按鈕的 callback
    onPermitCallback: function () {
        var msg = {
                seq: this.nextSeqNum(),
                reqType: 'permitJoin',
                args: {
                    time: permitJoinTime
                }
            },
            rspEvtName = msg.reqType + ':' + msg.seq;

        internalEmitter.once(rspEvtName, function (status, data) {
            if (status !== 0)
                alert('An error occurred with the permitJoin command.');
        });
        rpcClient.emit('req', msg);
    },

    onWriteCallback: function (addr, sid, cid, value) {
        var msg = {
                seq: this.nextSeqNum(),
                reqType: 'write',
                args: {
                    addr: addr,
                    sid: sid,
                    cid: cid,
                    value: value
                }
            },
            rspEvtName = msg.reqType + ':' + msg.seq;

        internalEmitter.once(rspEvtName, function (status, data) {
            if (status !== 0)
                alert('An error occurred with the write command.');
        });

        rpcClient.emit('req', msg);
    },

    render: function () {
        return (
            <MuiThemeProvider>
                <div>
                    <NavBar title={this.props.title} timeLeft={this.state.timeLeft} onClick={this.onPermitCallback}  />
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

