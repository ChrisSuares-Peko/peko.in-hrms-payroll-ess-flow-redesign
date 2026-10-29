import { DropDown } from '@customtypes/general';

interface DocumentDetails {
    document: string; // URL to the document
    issueDate: string; // Date in ISO string format
    expireDate: string; // Date in ISO string format
    documentNumber: string;
}
export interface OwnerData {
    id: number;
    ownerName: string;
    profilePicture: string;
    percentageOfShare: string;
    homeAddress: string;
    nationality: string;
    passport?: DocumentDetails;
    visa?: DocumentDetails;
    insurance?: DocumentDetails;
    emiratesId?: DocumentDetails;
    ejari?: DocumentDetails;
    bankDetails?: {
        name: string;
        iban: string;
        swiftcode: string;
        document: string;
    };
    createdAt: string; // Date in ISO string format
    updatedAt: string; // Date in ISO string format
    credentialId: number;
}

export interface OwnerDocListingResponse {
    result: OwnerData[];
    totalData: number;
}
export interface userPayload {
    userType: string;
    userId: number;
}

export interface OwnerCreatePayload extends userPayload {
    ownerName: string;
    percentageOfShare: number;
    homeAddress: string;
    nationality: string;
    profileImageBase: string;
    profileImageFormat: string;
}

export interface OwnerCreateResponse {
    id: number;
    ownerName: string;
    percentageOfShare: number;
    homeAddress: string;
    nationality: string;
    profilePicture: string;
    updatedAt: string;
    createdAt: string;
}
export interface OwnerUpdatePayload extends userPayload {
    ownerId: string;
    issueDate: string;
    expireDate: string;
    documentNumber: string;
    documentBase: string;
    documentFormat: string;
}
export interface employeeDeletePayload extends userPayload {
    ownerId: string;
}
export type CountriesResponse = {
    countries: DropDown;
};
