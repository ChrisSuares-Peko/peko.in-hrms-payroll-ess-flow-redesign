const orders = require("../models/use-cases/order");
const order = require("../models/entities/order");
const wallet = require("../models/entities/wallet");
const walletTransaction = require("../models/entities/transaction");
const sequelizeConfig = require("../configs/database/index");
const { v4: uuidv4 } = require("uuid");

const { findOneCoupon } = require('../models/use-cases/pekoCredits')
const { calculateDiscountResponse } = require('./calculateDiscount')
const UserCoupons = require("../models/entities/userCoupons.js");
const { publishJournalEvent } = require("./bull/queue/accountingEventsQueue");
const { CORPORATE_CARD_GATEWAY, CORPORATE_CARD_PAYMENT_MODE } = require("../constants/corporateCardPayment");



// exports.createPGTransaction = async (data) => {
//   //first we will check duplicity of order
//   // return new Promise(async(resolve,reject)=>{
//   try {
//     let {
//       providerId,
//       corporateTxnId,
//       credentialId,
//       serviceOperatorId,
//       accountNo,
//       corporateCashback,
//       payCashback,
//       orderAmount,
//       amount,
//       commissionType,
//       cashbackType,
//       providerCommission,
//       pgResponse,
//       pgAmount,
//       transactionCategory,
//       surcharge,
//       subCorporateUserId,
//     } = data;
//     let totalCashback = 0,
//       systemCashback = 0;
//     const isDuplicate = await orders.findOneOrder({
//       corporateTxnId,
//     });
//     if (isDuplicate) {
//       return {
//         error: "DUPLICATE TRANSACTION ID",
//       };
//     }
//     //calculate commission
//     if (commissionType === "PERCENTAGE") {
//       totalCashback = (
//         parseFloat(orderAmount) * parseFloat(providerCommission / 100)
//       ).toFixed(4);
//     } else {
//       totalCashback = providerCommission;
//     }
//     if (cashbackType === "PERCENTAGE") {
//       corporateCashback = (
//         parseFloat(totalCashback) * parseFloat(corporateCashback / 100)
//       ).toFixed(4);
//     }
//     systemCashback = (
//       parseFloat(totalCashback) - parseFloat(corporateCashback)
//     ).toFixed(4);

//     const result = await sequelizeConfig.transaction(async (t) => {
//       const walletDetails = await wallet.findOne({
//         where: {
//           credentialId,
//         },
//         lock: t.LOCK.UPDATE,
//         attributes: ["balance"],
//         transaction: t,
//       });
//       let corporateFinalBalance = parseFloat(
//         parseFloat(walletDetails["balance"]) -
//           (parseFloat(orderAmount) +
//             parseFloat(surcharge) -
//             parseFloat(pgAmount)) +
//           parseFloat(corporateCashback)
//       ).toFixed(4);
//       console.log("---------------PG---------------");
//       console.log("REQ_BODY", data);
//       console.log("Corporate Initial Balance", walletDetails["balance"]);
//       console.log("Amount", orderAmount);
//       console.log("PG Amount", pgAmount);
//       console.log("Corporate Cashback", corporateCashback);
//       console.log("Corporate Final Balance", corporateFinalBalance);
//       console.log("----------------PG--------------");
//       if (corporateFinalBalance < 0) {
//         throw "INSUFFICIENT WALLET BALANCE";
//       }
//       await wallet.update(
//         {
//           balance: corporateFinalBalance,
//         },
//         {
//           where: {
//             credentialId,
//           },
//           transaction: t,
//         }
//       );
//       let orderDetails = await order.create(
//         {
//           corporateTxnId: corporateTxnId,
//           providerId: providerId,
//           operatorId: uuidv4(),
//           corporateId: credentialId,
//           transactionDate: new Date(),
//           amountInINR: parseFloat(orderAmount) + parseFloat(surcharge),
//           baseAmount: parseFloat(orderAmount) + parseFloat(surcharge),
//           baseCurrency: "INR",
//           exchangeRate: 1,
//           status: "PENDING",
//           paymentMode:
//             parseFloat(orderAmount) +
//               parseFloat(surcharge) -
//               parseFloat(pgAmount) !=
//             0
//               ? "PG + WALLET"
//               : "PG",
//           paymentModeResponse: JSON.stringify({
//             ...pgResponse,
//             pgAmount,
//           }),
//           accountNo,
//           surcharge,
//           message: "",
//           serviceOperatorId,
//           credentialId,
//           subCorporateUserId,
//         },
//         {
//           transaction: t,
//         }
//       );

//       await walletTransaction.create(
//         {
//           corporateTxnId: corporateTxnId,
//           transactionDate: new Date(),
//           transactionType: "PAYMENT",
//           debitAmount:
//             parseFloat(orderAmount) +
//             parseFloat(surcharge) -
//             parseFloat(pgAmount),
//           creditAmount: corporateCashback,
//           totalCashback: totalCashback,
//           corporateCashback,
//           systemCashback,
//           transactionCategory,
//           balance: corporateFinalBalance,
//           remarks: "PENDING",
//           providerId: "",
//           orderId: orderDetails.id,
//           serviceOperatorId,
//           credentialId,
//         },
//         {
//           transaction: t,
//         }
//       );
//       return {
//         corporateFinalBalance,
//         corporateCashback,
//       };
//     });
//     return result;
//   } catch (err) {
//     console.log(err.message, err === "INSUFFICIENT WALLET BALANCE");
//     if (err === "INSUFFICIENT WALLET BALANCE") {
//       return {
//         error: "INSUFFICIENT WALLET BALANCE",
//       };
//     } else {
//       return {
//         error: "Internal server error",
//       };
//     }
//   }
// };

exports.createPGTransaction = async (data) => {
  //first we will check duplicity of order
  // return new Promise(async(resolve,reject)=>{
  try {
    let {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      accountNo,
      corporateCashback,
      orderAmount,
      commissionType,
      cashbackType,
      providerCommission,
      pgResponse,
      pgAmount,
      transactionCategory,
      surcharge,
      subCorporateUserId,
      couponCode,
      corporateUserId,
      partnerId,
      accessKey,
      reportData,
      batchId,
    } = data;
    let totalCashback = 0,
      systemCashback = 0;
    const isDuplicate = await orders.findOneOrder({
      corporateTxnId,
    });
    if (isDuplicate) {
      return {
        error: "DUPLICATE TRANSACTION ID",
      };
    }
    //calculate commission
    if (commissionType === "PERCENTAGE") {
      totalCashback = (
        parseFloat(orderAmount) * parseFloat(providerCommission / 100)
      ).toFixed(4);
    } else {
      totalCashback = providerCommission;
    }
    if (cashbackType === "PERCENTAGE") {
      corporateCashback = (
        parseFloat(totalCashback) * parseFloat(corporateCashback / 100)
      ).toFixed(4);
    }
    systemCashback = (
      parseFloat(totalCashback) - parseFloat(corporateCashback)
    ).toFixed(4);

     let couponDiscount = 0
     let userCouponData
     let serviceCouponCodeId = null
      if (couponCode) {
            const { data } = await findOneCoupon({ couponCode, corporateUserId, serviceId: serviceOperatorId, partnerId, accessKey })
            userCouponData = data
            if (userCouponData) {
                couponDiscount = calculateDiscountResponse(userCouponData.couponData, parseFloat(orderAmount) + parseFloat(surcharge)).data?.discountAmount

                // service-based coupon (from couponCodes table, no userCouponId at root)
                if (!userCouponData.id && userCouponData.couponData?.id) {
                    serviceCouponCodeId = userCouponData.couponData.id
                    const usedCount = await order.count({
                        where: { couponCodeId: serviceCouponCodeId, credentialId }
                    })
                    if (usedCount >= userCouponData.couponData.usageCount) {
                        return { error: 'COUPON_USAGE_LIMIT_EXCEEDED' }
                    }
                }
            }
        }

    const result = await sequelizeConfig.transaction(async (t) => {
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        lock: t.LOCK.UPDATE,
        attributes: ["balance"],
        transaction: t,
      });
      let corporateFinalBalance = parseFloat(
        parseFloat(walletDetails["balance"]) -
          ((parseFloat(orderAmount) +
            parseFloat(surcharge)) -
            (parseFloat(pgAmount) + parseFloat(couponDiscount))) +
          parseFloat(corporateCashback)
      ).toFixed(4);
      console.log("---------------PG Payment---------------");
      console.log("REQ_BODY", data);
      console.log("Corporate Initial Balance", walletDetails["balance"]);
      console.log("Amount", orderAmount);
      console.log("Surcharge", surcharge);
      console.log("Coupon Discount Amount", couponDiscount)
      console.log("PG Amount", pgAmount);
      console.log("Corporate Cashback", corporateCashback);
      console.log("Corporate Final Balance", corporateFinalBalance);
      console.log("----------------PG Payment--------------");
      if (corporateFinalBalance < 0) {
        throw "INSUFFICIENT WALLET BALANCE";
      }

      if (userCouponData && userCouponData.id) {
        const [claimedCount] = await UserCoupons.update(
            { status: 'CLAIMED', claimedAt: new Date(), usedCouponData: {...userCouponData.couponData, discountAmount:couponDiscount} },
            {
                where: { id: userCouponData.id, status: 'UNCLAIMED' },
                transaction: t
            }
        );
        if (!claimedCount) {
            throw "COUPON ALREADY CLAIMED";
        }
    }
      await wallet.update(
        {
          balance: corporateFinalBalance,
        },
        {
          where: {
            credentialId,
          },
          transaction: t,
        }
      );
      // Build order message with transaction details
      const orderTotalAmount = parseFloat(orderAmount) + parseFloat(surcharge);
      const paidAmount = orderTotalAmount - parseFloat(couponDiscount);
      const walletAmount = orderTotalAmount - parseFloat(pgAmount) - parseFloat(couponDiscount);
      const pgReceipt = Array.isArray(pgResponse) ? pgResponse[0] : pgResponse;
      // A corporate card redeem rides this path with its receipt as pgResponse; the order must say so.
      const gatewayLabel = pgReceipt?.gateway === CORPORATE_CARD_GATEWAY ? CORPORATE_CARD_PAYMENT_MODE : 'PAYMENT GATEWAY';
      const paymentMode = (orderTotalAmount - parseFloat(pgAmount) - parseFloat(couponDiscount)).toFixed(2) != 0 ? `${gatewayLabel} + WALLET` : gatewayLabel;
      
      let orderMessage = `Order created for ₹${orderTotalAmount.toFixed(2)}`;
      if (parseFloat(surcharge) > 0) {
        orderMessage += ` (Base: ₹${parseFloat(orderAmount).toFixed(2)}, Surcharge: ₹${parseFloat(surcharge).toFixed(2)})`;
      }
      if (parseFloat(couponDiscount) > 0) {
        orderMessage += `. Coupon discount: ₹${parseFloat(couponDiscount).toFixed(2)}. Final amount: ₹${paidAmount.toFixed(2)}`;
      }
      orderMessage += `. Payment via ${paymentMode}`;
      if (paymentMode === `${gatewayLabel} + WALLET`) {
        orderMessage += ` (PG: ₹${parseFloat(pgAmount).toFixed(2)}, Wallet: ₹${walletAmount.toFixed(2)})`;
      } else {
        orderMessage += ` (₹${parseFloat(pgAmount).toFixed(2)})`;
      }
      orderMessage += `. Transaction ID: ${corporateTxnId}`;

      let orderDetails = await order.create(
        {
          corporateTxnId: corporateTxnId,
          providerId: providerId,
          operatorId: uuidv4(),
          corporateId: credentialId,
          transactionDate: new Date(),
          amountInINR: orderTotalAmount,
          baseAmount: orderTotalAmount,
          baseCurrency: "INR",
          exchangeRate: 1,
          status: "PENDING",
          paymentMode: (parseFloat(orderAmount) + (parseFloat(surcharge))).toFixed(2) - (parseFloat(pgAmount) + parseFloat(couponDiscount)).toFixed(2) != 0 ? `${gatewayLabel} + WALLET` : gatewayLabel,
          paymentModeResponse: JSON.stringify({
            ...pgReceipt,
            pgAmount
          }),
          accountNo,
          surcharge,
          message: orderMessage,
          serviceOperatorId,
          credentialId,
          subCorporateUserId,
          userCouponId: userCouponData?.id || null, // peko credits ( ID from user coupon table )
          couponCodeId: serviceCouponCodeId, // counpon code from service-based coupon codes table (couponCodes)
          batchId,
          ...reportData
        },
        {
          transaction: t,
        }
      );
      const debitAmount =
        parseFloat(orderAmount) +
        parseFloat(surcharge) -
        parseFloat(pgAmount) -
        parseFloat(couponDiscount)
      let transactionDetails = await walletTransaction.create(
        {
          corporateTxnId: corporateTxnId,
          transactionDate: new Date(),
          transactionType: debitAmount == "0" ? "SYSTEM": "PAYMENT",
          debitAmount,
          creditAmount: corporateCashback,
          totalCashback: totalCashback,
          corporateCashback,
          systemCashback,
          transactionCategory,
          balance: corporateFinalBalance,
          remarks: "PENDING",
          providerId: "",
          orderId: orderDetails.id,
          serviceOperatorId,
          credentialId,
        },
        {
          transaction: t,
        }
      );
      return {
        corporateFinalBalance,
        corporateCashback,
        orderId: orderDetails.id,
        transactionId: transactionDetails.id,
        couponId: userCouponData ? userCouponData.id : null, 
        couponDiscount: couponDiscount,
        paymentMode: orderDetails.paymentMode,
      };
    });

    if (!result?.error && Number(result?.corporateCashback) > 0) {
      publishJournalEvent({
        transactionRef: corporateTxnId,
        type: "cashbackCredit",
        contextSnapshot: { credentialId },
        amounts: { amount: result.corporateCashback },
      });
    }

    return result;
  } catch (err) {
    console.log(err.message, err === "INSUFFICIENT WALLET BALANCE");
    if (err === "INSUFFICIENT WALLET BALANCE") {
      return {
        error: "INSUFFICIENT WALLET BALANCE",
      };
    } else if (err === "COUPON ALREADY CLAIMED") {
      return {
        error: "COUPON ALREADY CLAIMED",
      };
    } else {
      return {
        error: "Internal server error",
      };
    }
  }
};
