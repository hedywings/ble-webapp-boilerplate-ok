import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import GridLayout from 'react-grid-layout';
import {WidthProvider} from 'react-grid-layout';
import bipso from 'bipso';

import {Temperature, Relay} from '../Card/Card';

var ReactGridLayout = WidthProvider(GridLayout);

var keyCounter,
    layoutDataGrids;

var CardBlock = React.createClass({
    propTypes: {
        devs: PropTypes.object.isRequired
    },

    getCard: function (addr, status, servUuid, charUuid, value) {
        var type = bipso.uo(charUuid), 
            enable,
            card,
            cardProps = {};

        enable = (status === 'online') ? true : false;

        switch (type) {
            case 'temperature':
                cardProps.key = 'bigCard0';
                cardProps.dataGrid = {x: 3, y: 0, w: 2, h: 2};
                card = (<Temperature enable={enable} addr={addr} servUuid={servUuid} charUuid={charUuid} value={value} />);
                break;
            case 'pwrCtrl':
                cardProps.key = 'smallCard0';
                cardProps.dataGrid = {x: 5, y: 0, w: 1, h: 2};
                card = (<Relay enable={enable} addr={addr} servUuid={servUuid} charUuid={charUuid} value={value} onClick={this.props.onClick} />);
                break;
            default:
            	return;
        }

        return (
            <div key={cardProps.key} data-grid={cardProps.dataGrid}>
                {card}
            </div>
        );
    },

    getRowHeight: function () {
        var rowHeight;

        if (window.matchMedia("(min-width: 1800px)").matches) {
            rowHeight = 70;
        } else if (window.matchMedia("(min-width: 1400px)").matches) {
            rowHeight = 60;
        } else if (window.matchMedia("(min-width: 1000px)").matches) {
            rowHeight = 45;
        } else if (window.matchMedia("(min-width: 600px)").matches) {
            rowHeight = 35;
        } else {
            rowHeight = 20;
        }

        return rowHeight;
    },

    render: function () {
        var allCards = [],
            rowHeight = this.getRowHeight(),
            devs = this.props.devs;

        for (var addr in devs) {
            var devInfo = devs[addr];
            for (var i = 0; i < devInfo.servList.length; i += 1) {
                var servInfo = devInfo.servList[i];
                for (var j = 0; j < servInfo.charList.length; j += 1) {
                    var charInfo = servInfo.charList[j],
                        card = this.getCard(addr, devInfo.status, servInfo.uuid, charInfo.uuid, charInfo.value);

                    if (card)
                    	allCards.push(card);
                }
            }
        }

        return (
            <div style={{margin:'1% 0%'}}>
                <ReactGridLayout cols={9} rowHeight={rowHeight} isDraggable={false}>
                    {allCards}
                </ReactGridLayout>
            </div>
        );
    }
});

export default CardBlock