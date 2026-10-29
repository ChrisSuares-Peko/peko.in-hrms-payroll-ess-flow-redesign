const { formattedDateTime, formatNumberWithLocalString, snakeCaseToSentenceCase, toTitleCase, customTitlecase } = require("../utils/formatter")
const { customLog } = require("../utils/loggerHelper")

exports.generateCancelledHotelsExportData = async (params) => {
    try {
  
      let finalData = []
      params.rows.forEach(function (data) {
        const { createdAt, corporateTxnId, amountInINR, status } = data
        const refundingAmount = data?.shipmentStatus?.refundDetails?.refundAmount
        finalData.push({
          Date: createdAt ? formattedDateTime(createdAt) : 'Not Available',
          "Corporate Name": data?.credential?.name || 'Not Available',
          "Corporate ID": data?.credential?.username || 'Not Available',
          "Transaction ID": corporateTxnId,
          "Amount": amountInINR ? `INR ${formatNumberWithLocalString(amountInINR)}` : 'Not Available',
          "Refund": refundingAmount ? `INR ${formatNumberWithLocalString(refundingAmount)}` : 'Not Available',
          "Status": snakeCaseToSentenceCase(status),
        })
  
      })
      return finalData
    } catch (error) {
      throw new Error('Something went wrong while generating report')
    }
  }

  exports.generateBookingExportData = async (data) => {
  try {
    let finalData = []
    data.rows.forEach(function (limitData) {
      const orderResponse = limitData?.orderResponse ? JSON.parse(limitData.orderResponse) : null;
      const bookingReferenceId = orderResponse?.bookingDetailsResponse?.BookingRefNo

      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
        "Corporate Name": limitData?.credential?.name || 'Not Available',
        "Corporate ID": limitData?.credential?.username || 'Not Available',
        "Transaction ID": limitData?.corporateTxnId || 'Not Available',
        "Confirmation Number": bookingReferenceId || 'Not Available',
        "Amount": limitData?.amountInINR  ? `AED ${formatNumberWithLocalString(limitData?.amountInINR )}` : 'Not Available',
          "Payment Mode": toTitleCase(limitData?.paymentMode) || 'Not Available',
        "Status":  customTitlecase(orderResponse?.bookingDetailsResponse?.HotelBookingStatus || 'Not Available'),
      })
    })
    return finalData
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error: error });
    throw new Error('Something went wrong while generating report')
  }
}