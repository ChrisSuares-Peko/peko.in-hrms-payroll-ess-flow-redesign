export interface EligibleInvoice {
    id: string;
    invoiceNo: string;
    buyerName: string;
    amount: string;
    date: string;
    irn: string;
}

export interface ActiveWaybillEntry {
    id: string;
    invoiceRef: string;
    waybillNumber: string;
}

export type TransportMode = 'road' | 'rail' | 'air' | 'ship';
export type VehicleType = 'regular' | 'odc';

export interface EWaybillFormValues {
    transportMode: TransportMode | '';
    distance: string;
    transporterGstin: string;
    transporterName: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    transDocNo: string;
    transDocDt: string;
}

export interface GenerateEWaybillPayload {
    distance: number;
    transMode: string;
    transId: string;
    transName: string;
    vehNo?: string;
    vehType?: string;
    transDocNo?: string;
    transDocDate?: string;
}
