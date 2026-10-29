export type transactionResponse = {
    totalData: number;
    result: OrdersInfo[];
};

export type OrdersInfo = {
    order: {
        id: number;
        amountInINR: string;
        paymentMode: string;
        status: string;
        orderResponse: string;
        ecomOrderStatus: string;
        transactionDate: string;
        corporateTxnId: string;
        workspaceOrderStatus: string;
    };
    credential: {
        name: string;
        username: string;
    };
};

export type WorkOrderTableItems = {
    id: number;
    transactionDate: string;
    corporateTxnId: string;
    amount: string;
    paymentMode: string;
    status: string;
    workName: string;
    planName: string;
    corporateName: string;
    corporateUserName: string;
    pocName: string;
    email: string;
    requirement: string;
};

export type updateResponse = {
    result: number[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};