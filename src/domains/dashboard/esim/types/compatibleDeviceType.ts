export interface Device {
    model: string;
    os: string;
    brand: string;
    name: string;
}

export type DeviceList = {
    deviceList: Device[];
};
