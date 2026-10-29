const { formattedDateTime, formatNumberWithLocalString, snakeCaseToSentenceCase } = require('../utils/formatter');

exports.generateCancelledBusExportData = async (params) => {
    try {
        const finalData = [];
        params.rows.forEach((row) => {
            const { tin, travels, busType, cancellationDate, refundedAmount } = row;
            const tripDetails = row.tripDetails || {};
            finalData.push({
                'Date': row.createdAt ? formattedDateTime(row.createdAt) : 'Not Available',
                'Corporate Name': row?.credential?.name || 'Not Available',
                'Corporate ID': row?.credential?.username || 'Not Available',
                'Transaction ID': row?.order?.corporateTxnId || 'Not Available',
                'TIN': tin || 'Not Available',
                'Operator': travels || 'Not Available',
                'Bus Type': busType || 'Not Available',
                'From': tripDetails.sourceCity || 'Not Available',
                'To': tripDetails.destinationCity || 'Not Available',
                'Journey Date': tripDetails.doj || 'Not Available',
                'Amount': row?.order?.amountInINR ? `INR ${formatNumberWithLocalString(row.order.amountInINR)}` : 'Not Available',
                'Refund Amount': refundedAmount ? `INR ${formatNumberWithLocalString(refundedAmount)}` : 'Not Available',
                'Cancellation Date': cancellationDate ? formattedDateTime(cancellationDate) : 'Not Available',
                'Status': snakeCaseToSentenceCase(row?.order?.status || ''),
                'Payment Mode': row?.order?.paymentMode || 'Not Available',
            });
        });
        return finalData;
    } catch (error) {
        throw new Error('Something went wrong while generating bus report');
    }
};
