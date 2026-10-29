import { paths } from '@src/routes/paths';

import BookAHotel from '../assets/icons/BookAHotel.svg';
import BookAirTicket from '../assets/icons/BookAirTicket.svg';
import { VisaComponent } from '../types/visa';

export interface VisaAgeRange {
    minAge: number;
    maxAge?: number;
}

export interface VisaOption {
    id: string;
    productId: number;
    days: number;
    name: string;
    entryType: string;
    processingTime: string;
    price: number;
    pricePerPerson: number;
    platformPayNow: number;
    serviceFee: number;
    platformFee: number;
    gst: number;
    totalPayNow: number;
    embassyFee: number;
    visaInfo: string;
    requiredDocuments: string[];
    visaType?: string;
    adultAge?: VisaAgeRange;
    childAge?: VisaAgeRange;
    infantAge?: VisaAgeRange;
    childServiceFee?: number;
    childPlatformFee?: number;
    childGst?: number;
    childEmbassyFee?: number;
    childTotalPayNow?: number;
    childPricePerPerson?: number;
    infantServiceFee?: number;
    infantPlatformFee?: number;
    infantGst?: number;
    infantEmbassyFee?: number;
    infantTotalPayNow?: number;
    infantPricePerPerson?: number;
    breakupComponents: VisaComponent[];
    breakupServiceFee: number;
    breakupTaxServiceFee: number;
    totalGovtFees: number;
}

export const travelServices = [
    {
        icon: BookAirTicket,
        title: 'Book Air Ticket',
        status: '',
        path: 'airline',
    },
    {
        icon: BookAHotel,
        title: 'Book A Hotel',
        status: '',
        path: 'hotels',
    },
    {
        icon: BookAHotel,
        title: 'Book An eSIM',
        status: '',
        path: 'esim',
    },
];

export const links = [
    '',
    `${paths.airline.index}/${paths.airline.manage}`,
    `${paths.hotels.index}/${paths.hotels.manageBookings}`,
    paths.esim.orders,
];
