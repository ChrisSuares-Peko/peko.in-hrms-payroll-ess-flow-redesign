export type Director = {
    name: string;
    nationality: string;
    email: string;
    phone: string;
    pan: string;
};

export type Shareholder = {
    id: string;
    name: string;
    nationality: string;
    email: string;
    phone: string;
    pan: string;
    sharePercent: number; // 0–100; actual shares = Math.round(sharePercent / 100 * paidUpShares)
    isDirector?: boolean;
};
