export interface PassengerType {
    ptc: string;
    contact: {
        contactsProvided: {
            phone: {
                label: string;
                areaCode: string;
                phoneNumber: string;
            }[];
            emailAddress: string[];
        }[];
    };
    passengerKey: string;
    passengerInfo: {
        gender: string;
        surname: string;
        birthDate: string; // Using string for date in ISO format
        givenName: string;
        nameTitle: string;
    };
    airlineRequests: {
        osi: any[]; // Optional Special Information (OSI), you can refine this type based on usage
        ssr: any[]; // Special Service Requests (SSR), you can refine this type based on usage
    };
    identityDocuments: {
        idType: string;
        expiryDate: string;
        idDocumentNumber: string;
        issuingCountryCode: string;
        residenceCountryCode: string;
    }[];
}
