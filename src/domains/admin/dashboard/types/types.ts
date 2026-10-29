export type dashboardResponse = {
    data: Data;
};
export type CorporateData = {
    name: string;
    count: number;
};

export type MonthlyStatistic = {
    name: string;
    transactions: number;
    revenue: string | number;
    cashback: string | number;
};

export type Data = {
    monthlyCorporates: CorporateData[];
    monthlyStatistics: MonthlyStatistic[];
    totalRevenue: string;
    totalCorporates: number;
    totalCustomers: number;
    totalVendors: number;
    totalTransactions: number;
    totalCashback: string;
    activeUsers: number;
    activeCustomers: number;
    todaysCorporateUsers: number;
    todaysRevenue: null | string;
    todaysCashback: null | string;
    todaysTransactions: number;
    activeUsersTillDate: number;
    activeCustomersTillDate: number;
};

export type todaysDatas = {
    todaysCorporateUsers: number;
    todaysRevenue: null | string;
    todaysCashback: null | string;
    todaysTransactions: number;
};
export type totalDatas = {
    totalRevenue: string;
    totalCorporates: number;
    totalCustomers: number;
    totalVendors: number;
    totalTransactions: number;
    totalCashback: string;
    activeUsers: number;
    activeUsersTillDate: number;
    activeCustomers: number;
    activeCustomersTillDate: number;
};
export type CharDataType = {
    name: string;
    amount: number;
};
