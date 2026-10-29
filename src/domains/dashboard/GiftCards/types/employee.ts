export type employeeResponse = {
    employees: employeeTypes[];
};
export type employeeTypes = {
    fullName: string;
    value: string;
    label: string;
    personalEmail: string;
    id: string;
    employeeInformation: {
        employeeId: string;
    };
    personalInformation: {
        fullName: string;
        email: string;
    };
};

export enum GiftCardOrderTypes {
    BUYFORSELF = 'buyForSelf',
    BULKPURCHASE = 'bulkPurchase',
    BUYFOROTHER = 'buyForOther',
    BUYFOREMPLOYEE = 'buyForEmployees',
}

export interface SelectedEmployee {
    receiverFirstName: string;
    receiverEmail: string;
    label: string;
}
