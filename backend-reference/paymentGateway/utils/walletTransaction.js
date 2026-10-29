const orders = require("../models/use-cases/order");
const order = require("../models/entities/order");
const wallet = require("../models/entities/wallet");
const walletTransaction = require("../models/entities/transaction");
const sequelizeConfig = require("../configs/database/index");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const { customLog } = require("./loggerHelper");
const UserCoupons = require("../models/entities/userCoupons");
const { publishJournalEvent } = require("./bull/queue/accountingEventsQueue");

exports.createWalletTransaction = async (data) => {
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
      transactionCategory,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      surcharge,
      reportData,
      subCorporateUserId,
      batchId
    } = data;
    const debitAmount = Number(amount);
    const debitSurcharge = Number(surcharge ?? 0);
    if (!Number.isFinite(debitAmount) || debitAmount <= 0 || !Number.isFinite(debitSurcharge) || debitSurcharge < 0) {
      customLog(null, "error", { action: "wallet:invalidDebitAmount", corporateTxnId, credentialId, serviceOperatorId, amount, surcharge });
      return {
        error: "INVALID AMOUNT",
      };
    }
    console.log(data);
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
        parseFloat(amount) * parseFloat(providerCommission / 100)
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

    const result = await sequelizeConfig.transaction(async (t) => {
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        lock: t.LOCK.UPDATE,
        attributes: ["balance"],
        transaction: t,
      });
      console.log(parseFloat(amount))
      console.log((surcharge))
      amount = (debitAmount + debitSurcharge).toFixed(2);
      let corporateFinalBalance = parseFloat(
        parseFloat(walletDetails["balance"]) -
          parseFloat(amount) +
          parseFloat(corporateCashback)
      ).toFixed(4);
      console.log("---------------WALLET---------------");
      console.log("REQ_BODY", data);
      console.log("Corporate Initial Balance", walletDetails["balance"]);
      console.log("Amount", amount);
      console.log("Corporate Cashback", corporateCashback);
      console.log("Corporate Final Balance", corporateFinalBalance);
      console.log("----------------WALLET--------------");
      if (!Number.isFinite(Number(corporateFinalBalance))) {
        throw "INVALID AMOUNT";
      }
      if (corporateFinalBalance < 0) {
        throw "INSUFFICIENT WALLET BALANCE";
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
      let orderDetails = await order.create(
        {
          corporateTxnId: corporateTxnId,
          providerId: providerId,
          operatorId: uuidv4(),
          corporateId: credentialId,
          transactionDate: new Date(),
          amountInINR: amount,
          baseAmount: amount,
          baseCurrency: "INR",
          exchangeRate: 1,
          status: "PENDING",
          paymentMode: "WALLET",
          accountNo,
          surcharge,
          message: "",
          serviceOperatorId,
          credentialId,
          subCorporateUserId,
          batchId,  // Store batchId for bulk payment tracking
          ...reportData
        },
        {
          transaction: t,
        }
      );

     let transactionDetails = await walletTransaction.create(
        {
          corporateTxnId: corporateTxnId,
          transactionDate: new Date(),
          transactionType: "PAYMENT",
          debitAmount: amount,
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
    if (err === "INSUFFICIENT WALLET BALANCE" || err === "INVALID AMOUNT") {
      return {
        error: err,
      };
    } else {
      return {
        error: "Internal server error",
      };
    }
  }
};

exports.updateWalletTransaction = async (data) => {
  const { corporateTxnId } = data;
  delete data.corporateTxnId;
  try {
    await sequelizeConfig.transaction(async (t) => {
      let orderDetails = {
        message: data.message,
        status: data.status,
        providerId: data.providerId,
      };
      if (data.orderResponse) {
        orderDetails.orderResponse = data.orderResponse;
      }
      await order.update(orderDetails, {
        where: {
          corporateTxnId: { [Op.eq]: corporateTxnId }
        },
        transaction: t,
      });
      await walletTransaction.update(
        {
          providerId: data.providerId,
          remarks: data.message,
          status: data.status,
        },
        {
          where: {
            corporateTxnId: { [Op.eq]: corporateTxnId },
            // never overwrite refund ledger rows (REFUND / REFUNDED) - keeps
            // journals intact and the ALREADY REFUNDED guard working
            remarks: { [Op.notLike]: 'REFUND%' },
          },
          transaction: t,
        }
      );
      return true;
    });
  } catch (err) {
    console.log(err);
  }
};

exports.refundWalletTransaction = async (meta) => {
  const { corporateTxnId, partialRefund,couponId } = meta;
  delete meta.corporateTxnId;
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const t = await sequelizeConfig.transaction({
      autocommit: false,
    });
    try {
      console.log("::: refund Transaction Start:::");
      let tranStatus = "REFUND",
        oldTranStatus = "REFUNDED";
      let newTranData,
        tranDate = new Date();
      const data = await walletTransaction.findOne({
        where: { corporateTxnId: String(corporateTxnId) },
        raw: true,
      });
      if (data) {
        if (String(data.remarks || "").indexOf("REFUND") === 0) {
          let response = "ALREADY REFUNDED";
          await t.rollback()
          resolve(response);
        } else {
          const corporateWalletData = await wallet.findOne({
            where: {
              credentialId: data.credentialId,
            },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });
          const lockedPayment = await walletTransaction.findOne({
            where: { id: data.id },
            attributes: ["remarks"],
            lock: t.LOCK.UPDATE,
            transaction: t,
            raw: true,
          });
          if (!lockedPayment || String(lockedPayment.remarks || "").indexOf("REFUND") === 0) {
            await t.rollback();
            customLog(null, "info", { action: "wallet:refundRaceSkipped", corporateTxnId });
            return resolve("ALREADY REFUNDED");
          }
          /*
                      Initializing Corporate Transaction
                    */
          data.transactionDate = tranDate;
          if (partialRefund && partialRefund?.status == true) {
            //need to manage the partial refund
            let { walletRefund } = partialRefund
            data.balance = parseFloat(corporateWalletData.balance) + parseFloat(walletRefund) - parseFloat(data.creditAmount)
            data.debitAmount = -walletRefund
        } else {
            data.balance = parseFloat(corporateWalletData.balance) + parseFloat(data.debitAmount) - parseFloat(data.creditAmount)
            data.debitAmount *= -1
        }
          data.creditAmount *= -1;
          data.corporateCashback *= -1;
          data.systemCashback *= -1;
          data.remarks = tranStatus;

          newTranData = data;

          if (couponId) {
            await UserCoupons.update(
                { status: 'UNCLAIMED', claimedAt: null, usedCouponData: null },
                {
                    where: { id: couponId },
                    transaction: t
                }
            );
        }

          await wallet.update(
            {
              balance: newTranData.balance,
            },
            {
              where: {
                credentialId: data.credentialId,
              },
              transaction: t,
            }
          );
          delete newTranData.id;
          delete newTranData.orderId;
          const originalCreatedAt = new Date(newTranData.createdAt);
          newTranData.createdAt = new Date(originalCreatedAt.getTime() + 1000);
          newTranData.updatedAt = new Date(originalCreatedAt.getTime() + 1000);
          await walletTransaction.create(newTranData, {
            transaction: t,
          });
          let updatedOrderData = {};
          updatedOrderData.status = Object.prototype.hasOwnProperty.call(meta, 'status') ? meta.status : 'REFUNDED'
          updatedOrderData.message = Object.prototype.hasOwnProperty.call(meta, 'message') ? meta.message : 'REVERSAL'
          // updatedOrderData.orderResponse = meta.hasOwnProperty("orderResponse")
          //   ? meta.orderResponse
          //   : "";
          if (Object.prototype.hasOwnProperty.call(meta, 'orderResponse')) {
            updatedOrderData.orderResponse = meta.orderResponse
          }
          updatedOrderData.couponCodeId = null
          customLog(null, "info", { message: "updatedOrderData ", updatedOrderData })
          await order.update(updatedOrderData, {
            where: { corporateTxnId: String(corporateTxnId) },
            transaction: t,
          });
          await walletTransaction.update(
            {
              remarks: oldTranStatus,
              status: updatedOrderData.status,
            },
            {
              where: {
               corporateTxnId: String(corporateTxnId) ,
                  remarks: {
                  [Op.ne]: tranStatus,
                },
              },
              transaction: t,
            }
          );
          let paymentModeResponseDetails = await order.findOne({
            where: { corporateTxnId: String(corporateTxnId) },
            attributes: ["paymentModeResponse"],
          });
          if (paymentModeResponseDetails) {
            JSON.parse(paymentModeResponseDetails.paymentModeResponse)
            // let dapiDetails = JSON.parse(
            //   paymentModeResponseDetails.paymentModeResponse
            // );
            // if (
            //   dapiDetails &&
            //   dapiDetails["dapiAmount"] &&
            //   dapiDetails["dapiAmount"] > 0
            // )
            //   await transferFund(
            //     {
            //       credentialId: data.credentialId,
            //       amount: dapiDetails["dapiAmount"],
            //       remarks: "DAPI REFUND " + corporateTxnId,
            //       type: "Credit",
            //       registeredById,
            //     },
            //     t
            //   );
            // if (
            //   dapiDetails &&
            //   dapiDetails["pgAmount"] &&
            //   dapiDetails["pgAmount"] > 0
            // )
            //   await transferFund(
            //     {
            //       credentialId: data.credentialId,
            //       amount: dapiDetails["pgAmount"],
            //       remarks: "PG REFUND " + corporateTxnId,
            //       type: "Credit",
            //       registeredById,
            //     },
            //     t
            //   );
          }
          await t.commit();
          let walletDetails = {
            corporateBalance: newTranData.balance,
          };

          const cashbackReversalAmount = parseFloat(-newTranData.creditAmount) || 0;
          if (cashbackReversalAmount > 0) {
            publishJournalEvent({
              transactionRef: corporateTxnId,
              type: "cashbackReversal",
              contextSnapshot: { credentialId: data.credentialId },
              amounts: { amount: cashbackReversalAmount },
            });
          }

          console.log("::: refund Transaction End:::");
          resolve(walletDetails);
        }
      } else {
        await t.rollback()
        resolve("NO TRANSACTIONS FOUND");
      }
    } catch (error) {
      await t.rollback();
      console.log("::: refund Transaction End:::");
      console.log(error);
      console.log("::: refund Transaction End:::");
      reject({
        type: "ERROR",
        description: error,
      });
    }
  });
};

// eslint-disable-next-line no-unused-vars
async function transferFund(data, t) {
  let { credentialId, amount, remarks, type, registeredById } = data;
  const corporateWallet = await wallet.findOne({
    where: {
      credentialId,
    },
    lock: t.LOCK.UPDATE,
    attributes: ["balance"],
    transaction: t,
  });
  const adminWallet = await wallet.findOne({
    where: {
      credentialId: data["registeredById"],
    },
    lock: t.LOCK.UPDATE,
    attributes: ["balance"],
    transaction: t,
  });
  let modifiedAmount = type === "Credit" ? amount : amount * -1;
  let corporateFinalBalance = parseFloat(
    parseFloat(corporateWallet["balance"]) + parseFloat(modifiedAmount)
  ).toFixed(4);
  let adminFinalBalance = parseFloat(
    parseFloat(adminWallet["balance"]) - parseFloat(modifiedAmount)
  ).toFixed(4);
  await wallet.update(
    {
      balance: adminFinalBalance,
    },
    {
      where: {
        credentialId: registeredById,
      },
      transaction: t,
    }
  );
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
  if (corporateFinalBalance < 0) {
    throw "INSUFFICIENT WALLET BALANCE";
  }
  let transactionDate = new Date();
  await walletTransaction.create(
    {
      corporateTxnId: transactionDate.valueOf(),
      transactionDate: transactionDate,
      transactionCategory:
        type === "Credit" ? "FUND TRANSFER" : "FUND REVERSAL",
      transactionType: type === "Credit" ? "CREDIT" : "DEBIT",
      creditAmount: type === "Credit" ? amount : 0,
      debitAmount: type === "Credit" ? "0" : amount,
      totalCashback: 0,
      corporateCashback: 0,
      systemCashback: 0,
      balance: corporateFinalBalance,
      remarks,
      providerId: data["registeredByname"],
      credentialId,
    },
    {
      transaction: t,
    }
  );
  await walletTransaction.create(
    {
      corporateTxnId: transactionDate.valueOf(),
      transactionDate: transactionDate,
      transactionCategory: "FUND TRANSFER",
      transactionType: type === "Debit" ? "CREDIT" : "DEBIT",
      creditAmount: type === "Credit" ? "0" : amount,
      debitAmount: type === "Credit" ? amount : 0,
      totalCashback: 0,
      corporateCashback: 0,
      systemCashback: 0,
      balance: adminFinalBalance,
      remarks,
      credentialId: registeredById,
    },
    {
      transaction: t,
    }
  );
  return {
    corporateFinalBalance,
    adminFinalBalance,
  };
}
