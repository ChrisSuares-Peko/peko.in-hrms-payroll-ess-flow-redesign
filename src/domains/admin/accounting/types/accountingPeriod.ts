export interface AccountingGoLiveDate {
    date: string | null;
    configured: boolean;
    setByName?: string | null;
    setAt?: string | null;
    reason?: string | null;
}

export interface AccountingGoLiveDatePayload {
    date: string;
    reason: string;
}
