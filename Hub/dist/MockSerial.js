"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSerial = void 0;
class MockSerial {
    constructor(options) {
        this.options = options;
        console.log(`MockSerial initialized with portId ${options.portId} and baudRate ${options.baudRate}`);
    }
    open(callback) {
        console.log("MockSerial port opened");
        callback(null);
    }
    write(data, callback) {
        console.log(`MockSerial wrote: ${data}`);
        callback(null);
    }
    close(callback) {
        console.log("MockSerial port closed");
        callback(null);
    }
    on(event, callback) {
        console.log(`MockSerial event ${event} registered`);
    }
}
exports.MockSerial = MockSerial;
