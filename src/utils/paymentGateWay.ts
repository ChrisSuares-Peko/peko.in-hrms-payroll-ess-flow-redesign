
type PGRefundParams = {
    transactionDate: string | number | Date;
    status: string;
    paymentMode: string;
};
type PGRefundRes = {
    status: boolean;
    message: string;
};
export const calculateTimeRemainingForPGRefund = ({ transactionDate, status, paymentMode }: PGRefundParams): PGRefundRes => {
    try {
        if (status === 'REFUNDED' || paymentMode === 'WALLET') {
            return { status: true, message: '' };
        }
        const oneHourInMilliseconds = 3600000;
        const oneMinuteInMilliseconds = 60000;

        const transactionDateUTC = new Date(transactionDate);
        const refundDeadline = new Date(transactionDateUTC.getTime() + 24 * oneHourInMilliseconds);
        const currentDate = new Date();

        // If more than 24 hours passed
        if (currentDate >= refundDeadline) {
            return { status: true, message: '' };
        }

        // Calculate time left
        const diffMs = refundDeadline.getTime() - currentDate.getTime();
        const hours = Math.floor(diffMs / oneHourInMilliseconds);
        const minutes = Math.floor((diffMs % oneHourInMilliseconds) / oneMinuteInMilliseconds);

        return { status: false, message: `${hours}h ${minutes}min to refund` };
    } catch (error) {
        return { status: false, message: 'N/A' };
    }
}
