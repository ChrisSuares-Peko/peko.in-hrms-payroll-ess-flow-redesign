import { IProvBooking } from '../types/provBooking';

export const bookingData: IProvBooking = {
    offerId: '',
    conversationId: '',
    details: {
        ancillaryDetailsAvailable: true,
        lcc: false,
        apis: true,
        ndc: false,
        onHoldSupported: true,
        moreFaresAvailable: false,
        reissueSupported: false,
        fareRuleMandatory: false,
    },
    passengers: [],
    customerInfo: {
        emailAddress: '',
    },
    journey: [
        {
            flight: {
                flightKey: '',
                flightInfo: {
                    duration: '',
                },
                segmentReference: {
                    onPoint: '',
                    offPoint: '',
                },
                stopQuantity: 2,
            },
            flightSegments: [],
        },
    ],
};
