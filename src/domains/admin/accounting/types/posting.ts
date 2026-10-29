export type PostingState = 'posted' | 'notPosted' | 'notApplicable';

export interface Posting {
    state: PostingState;
    note: string | null;
    detail: string | null;
}
