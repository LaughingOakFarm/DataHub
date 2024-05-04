import { ISerial, ISerialOptions } from "./Interfaces";

export class MockSerial implements ISerial {
    constructor(private options: ISerialOptions) {
        console.log(`MockSerial initialized with portId ${options.portId} and baudRate ${options.baudRate}`);
    }

    open(callback: (error: any) => void): void {
        console.log("MockSerial port opened");
        callback(null);
    }

    write(data: string, callback: (error: any) => void): void {
        console.log(`MockSerial wrote: ${data}`);
        callback(null);
    }

    close(callback: (error: any) => void): void {
        console.log("MockSerial port closed");
        callback(null);
    }

    on(event: string, callback: (data: any) => void): void {
        console.log(`MockSerial event ${event} registered`);
    }
}