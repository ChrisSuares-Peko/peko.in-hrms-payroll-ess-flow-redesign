export interface LedgerBooksMark {
    booksSynced?: boolean;
    booksSyncedAt?: string | null;
    booksSyncedByName?: string | null;
    deleted?: boolean;
    deletedAt?: string | null;
    deletedByName?: string | null;
    deleteReason?: string | null;
}
