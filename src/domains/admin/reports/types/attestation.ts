export type docAttestation = {
    id: number;
    documentType: string;
    issuedCountry: string;
    submissionCountry: string;
    passportDoc: string;
    address: string;
    poBox: string;
    contactPersonPhone: string;
    remarks: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: {
        id: number;
        name: string;
    };
    email: string;
};
export type docAttestationData = {
    recordsTotal: number;
    data: docAttestation[];
};

export type DocumentEdit = {
    id: number;
    address: string;
    poBox: string;
    contactPersonPhone: string;
    remarks: string;
    base64String: string;
    documentFormat: string;
    status: string;
    email: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};