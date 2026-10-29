// Admin-managed registry of email template "keys" (e.g. WELCOME_EMAIL) and the
// ${variable} placeholder names each one documents. `variables` is a flat
// name-only map — values are always '', only the names carry meaning. These
// names become the ${variable} placeholders the key's send site substitutes;
// nothing here drives the actual substitution, which still comes entirely from
// whatever values the send site supplies at send time.
export type EmailTemplateKeyVariables = Record<string, string>;

export type EmailTemplateKey = {
    id: number;
    key: string;
    serviceId: number;
    service: string;
    variables: EmailTemplateKeyVariables;
    isActive: boolean;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
};

export type EmailTemplateKeyListParams = {
    search?: string;
    service?: string;
    isActive?: boolean;
    page?: number;
    itemsPerPage?: number;
};

export type EmailTemplateKeyListResponse = {
    recordsTotal: number;
    rows: EmailTemplateKey[];
};

export type CreateEmailTemplateKeyPayload = {
    key: string;
    service: string;
    isActive?: boolean;
};

// PUT body for the variables-only update — identified by (service, key), not id,
// and always a full replace of the set.
export type UpdateEmailTemplateKeyVariablesPayload = {
    service: string;
    key: string;
    variables: EmailTemplateKeyVariables;
};
