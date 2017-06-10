'use strict';

function Cube(sid, hub, rotatePosition) {
    this.type            = 'cube';
    this.sid             = sid;
    this.hub             = hub;
    this.voltage         = null;
    this.percent         = null;
    this.rotate_position = parseFloat(rotatePosition || 0) || 0;

    return this;
}

Cube.prototype.trigger = function (obj, name) {
    obj[name] = true;
    var that = this;

    setTimeout(function () {
        var _obj = {};
        _obj[name] = false;
        that.hub.emit('data', that.sid, that.type, _obj);
    }, 300);
};

Cube.prototype.getData = function (data) {
    var newData = false;
    var obj = {};
    if (data.voltage) {
        data.voltage = parseInt(data.voltage, 10);
        this.voltage = data.voltage / 1000;
        this.percent = ((data.voltage - 2200) / 10);
        obj.voltage  = this.voltage;
        obj.percent  = this.percent;
        newData = true;
    }

    if (data.status) {
        // flip90, flip180, move, tap_twice, shake_air, swing, alert, free_fall, rotate_left, rotate_right
        this.trigger(obj, data.status);
        newData = true;
    }
    if (data.rotate) {
        // rotate
        obj.rotate = parseFloat(data.rotate.replace(',', '.')) || 0;
        if (obj.rotate >= 0) {
            this.trigger(obj, 'rotate_right');
        } else if (obj.rotate < 0) {
            this.trigger(obj, 'rotate_left');
        }
        this.rotate_position += obj.rotate;
        if (this.rotate_position < 0)   this.rotate_position = 0;
        if (this.rotate_position > 100) this.rotate_position = 100;
        obj.rotate_position = this.rotate_position;

        newData = true;
    }

    return newData ? obj : null;
};

Cube.prototype.Control = function (attr, val) {
    if (attr === 'rotate_position') {
        val = parseFloat(val);
        if (val < 0) val = 0;
        if (val > 100) val = 100;

        if (this.rotate_position !== val) {
            this.hub.emit('data', this.sid, this.type, {rotate_position: this.rotate_position});
        }
    }
};

Cube.prototype.heartBeat = function (token, data) {
    if (data) {
        var obj = this.getData(data);
        if (obj) {
            this.hub.emit('data', this.sid, this.type, obj);
        }
    }
};

Cube.prototype.onMessage = function (message) {
    if (message.data) {
        var obj = this.getData(message.data);
        if (obj) {
            this.hub.emit('data', this.sid, this.type, obj);
        }
    }
};

module.exports = Cube;