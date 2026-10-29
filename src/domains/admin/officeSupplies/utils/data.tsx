export const DeliveryOptions = [
    { oValue: 'PENDING', oName: 'Pending', textColor: '#D7341E' },
    { oValue: 'CONFIRMED', oName: 'Confirmed', textColor: '#CD9300' },
    { oValue: 'INPROGRESS', oName: 'In Progress', textColor: '#54AEE1' },
    { oValue: 'SHIPPED', oName: 'Shipped', textColor: '#51B18D' },
    { oValue: 'COMPLETED', oName: 'Delivered', textColor: '#26A411' },
    { oValue: 'CANCELLED', oName: 'Cancelled', textColor: '#000000' },
];

export const PaymentStatusOptions = [
    { oValue: 'PAID', oName: 'Paid' },
    // { oValue: 'CASHBACK', oName: 'Cashback' },
    { oValue: 'REFUND', oName: 'Refund' },
    { oValue: 'SUCCESS', oName: 'Success' },
];

export const CancellationStatusOptions = [
    { oValue: 'Cancel requested', oName: 'Cancel requested' },
    { oValue: 'Cancel approved', oName: 'Cancel approved' },
    { oValue: 'Cancel rejected', oName: 'Cancel rejected' },
];

export const ReturnStatusOptions = [
    { oValue: 'Return Requested', oName: 'Return Requested' },
    { oValue: 'Return Initiated', oName: 'Return Initiated' },
    { oValue: 'Return Completed', oName: 'Return Completed' },
    { oValue: 'Return Rejected', oName: 'Return Rejected' },
];
export const allowedReturnStatus = ['Return Rejected', 'Return Completed', 'Return Initiated'];
export const getCurrentStep = (status: string) => {
    switch (status) {
        case 'INPROGRESS':
            return 1;
        case 'SHIPPED':
            return 2;
        case 'COMPLETED':
            return 3;
        default:
            return 0;
    }
};
