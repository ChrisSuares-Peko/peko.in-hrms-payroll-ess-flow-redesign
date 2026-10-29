// Business Registration — new service (vendor TBD). Types grow per screen as
// designs are provided. Kept intentionally lean since the API isn't finalised.

export enum EntityType {
    PROPRIETORSHIP = 'proprietorship',
    PARTNERSHIP = 'partnership',
    PRIVATE_LIMITED = 'private_limited',
    OPC = 'opc',
    LLP = 'llp',
}

// Grows as each screen defines its data. Indexable so step components can stash
// their own slices without a premature global schema.
export interface ApplicationPayload {
    entityType?: EntityType | '';
    [key: string]: unknown;
}

export interface BusinessRegistrationState {
    currentApplication: Partial<ApplicationPayload>;
    submittedApplication: unknown | null;
    isLoading: boolean;
    error: string | null;
}
