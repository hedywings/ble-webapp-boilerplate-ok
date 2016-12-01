import React, { PropTypes } from 'react';
import PlugOnIcon from '../Icons/PlugOnIcon';
import PlugOffIcon from '../Icons/PlugOffIcon';

const Relay = React.createClass({
    propTypes: {
        enable: PropTypes.bool.isRequired,
        onOff: PropTypes.bool.isRequired,
        onClick: PropTypes.func.isRequired,
        permAddr: PropTypes.string.isRequired,
        auxId: PropTypes.string.isRequired,
    },
    render: function () {
        let onOff = this.props.onOff;
        let enable = this.props.enable;

        let icon = onOff ? <PlugOnIcon /> : <PlugOffIcon />;

        let cardBgColor = enable ? "#72E599" : "#BDBDBD";
        let onClick = enable ? this.props.onClick : function () {};

        return (
            <div style={{width: '100%', height: '100%', backgroundColor: cardBgColor }}
                onClick={onClick(this.props.permAddr, this.props.auxId, !onOff)}>
                {icon}
            </div>
        );
    }

});

export default Relay