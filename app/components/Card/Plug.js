import React, { PropTypes } from 'react';
import RealyOnIcon from '../Icons/RelayOnIcon';
import RealyOffIcon from '../Icons/RelayOffIcon';

const Relay = React.createClass({
    propTypes: {
        enable: PropTypes.bool.isRequired,
        value: PropTypes.object.isRequired,
        onClick: PropTypes.func.isRequired,
        addr: PropTypes.string.isRequired,
        servUuid: PropTypes.string.isRequired,
        charUuid: PropTypes.string.isRequired
    },
    render: function () {
        let onOff = this.props.value.onOff;
        let enable = this.props.enable;

        let icon = onOff ? <RealyOnIcon /> : <RealyOffIcon />;

        let cardBgColor = enable ? "#72E599" : "#BDBDBD";
        let onClick = enable ? this.props.onClick : function () {};

        let copyValue = Object.assign({}, this.props.value);
        copyValue.onOff = !onOff;

        return (
            <div style={{width: '100%', height: '100%', backgroundColor: cardBgColor }}
                onClick={onClick(this.props.addr, this.props.servUuid, this.props.charUuid, copyValue)}>
                {icon}
            </div>
        );
    }

});

export default Relay