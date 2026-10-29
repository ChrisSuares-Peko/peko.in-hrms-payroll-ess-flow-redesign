import { EWaybillFormValues } from '../types/eWaybill';

export const TRANSPORT_MODES: { value: 'road' | 'rail' | 'air' | 'ship'; label: string }[] = [
    { value: 'road', label: 'Road' },
    { value: 'rail', label: 'Rail' },
    { value: 'air', label: 'Air' },
    { value: 'ship', label: 'Ship' },
];

export const E_WAYBILL_RULES = [
    'Required for goods movement > \u20B950,000 in value',
    "Can be cancelled within 24 hours if goods haven't moved",
    'Validity: 1 day per 200 km (up to 15 days for ODC)',
    'Part-B (transport details) can be updated any time during validity',
];

export const eWaybillInitialValues: EWaybillFormValues = {
    transportMode: 'road',
    distance: '',
    transporterGstin: '',
    transporterName: '',
    vehicleNumber: '',
    vehicleType: 'regular',
    transDocNo: '',
    transDocDt: '',
};
