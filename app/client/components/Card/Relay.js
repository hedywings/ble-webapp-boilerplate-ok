import React, { PropTypes } from 'react';
import RelayOnIcon from '../Icons/RelayOnIcon';
import RelayOffIcon from '../Icons/RelayOffIcon';

const Relay = React.createClass({
    propTypes: {
        enable: PropTypes.bool.isRequired,
        value: PropTypes.object.isRequired,
        onClick: PropTypes.func.isRequired,
        addr: PropTypes.string.isRequired,
        servUuid: PropTypes.string.isRequired,
        charUuid: PropTypes.string.isRequired
    },
    handleClick: function () {
        let onClick = this.props.enable ? this.props.onClick : function () {};
        let relayValue = Object.assign({}, this.props.value);

        relayValue.onOff = !this.props.value.onOff;
        onClick(this.props.addr, this.props.servUuid, this.props.charUuid, relayValue);
    },
    render: function () {
        let cardBgColor = this.props.enable ? "#72E599" : "#BDBDBD";
        let icon = this.props.value.onOff ? <RelayOnIcon /> : <RelayOffIcon />;

        return (
            <div style={{width: '100%', height: '100%', backgroundColor: cardBgColor}} onClick={this.handleClick}>
                {icon}
            </div>
        );
    }

});

export default Relay