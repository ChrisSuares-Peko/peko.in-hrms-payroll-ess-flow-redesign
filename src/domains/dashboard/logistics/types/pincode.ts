import { RequestPayload } from './index';

interface IDataSetPincodeResponse {
    weight_from: number;
    weight_to: number;
    cost_price: string;
    cod: boolean;
    cod_charges: string;
}

export interface CheckPincodeRequestPayload extends RequestPayload {
    pinCode: string;
    merchant?: string;
    serviceType: string;
    pickupLocation?: string;
}

export interface CheckPincodeResponse {
    data: IDataSetPincodeResponse[];
    type: string;
    percentage: number;
    city: string;
}
