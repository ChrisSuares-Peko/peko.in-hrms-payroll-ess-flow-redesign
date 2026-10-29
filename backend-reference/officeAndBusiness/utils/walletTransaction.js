/* eslint-disable no-prototype-builtins */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
const orders = require("./../models/use-cases/order");
const order = require("./../models/entities/order");
const wallet = require("./../models/entities/wallet");
const walletTransaction = require("./../models/entities/transaction");
const sequelizeConfig = require("./../configs/database/index");
const asyncHandler = require("../middlewares/async");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

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
      payCashback,
      paymentMode,
      transactionCategory,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      surcharge,
      reportData
    } = data;
    // Reject negative or non-numeric amount / negative surcharge: a negative amount would increase
    // the wallet balance (self-credit), and a missing amount would corrupt it (NaN). Zero is allowed
    // (harmless no-op) so genuine free/zero-cost flows are not broken.
    if (!(parseFloat(amount) >= 0) || parseFloat(surcharge) < 0) {
      return { error: "INVALID AMOUNT" };
    }
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
      amount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2);
      let corporateFinalBalance = parseFloat(
        parseFloat(walletDetails["balance"]) -
          parseFloat(amount) +
          parseFloat(corporateCashback)
      ).toFixed(4);
      console.log("---------------WALLET---------------");
      console.log("Corporate Initial Balance", walletDetails["balance"]);
      console.log("Amount", amount);
      console.log("Corporate Cashback", corporateCashback);
      console.log("Corporate Final Balance", corporateFinalBalance);
      console.log("----------------WALLET--------------");
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
          ...reportData
        },
        {
          transaction: t,
        }
      );

      await walletTransaction.create(
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
      };
    });
    return result;
  } catch (err) {
    console.log(err.message, err === "INSUFFICIENT WALLET BALANCE");
    if (err === "INSUFFICIENT WALLET BALANCE") {
      return {
        error: "Insufficient funds in your wallet. Please top up your wallet to continue.",
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
    const result = await sequelizeConfig.transaction(async (t) => {
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
          corporateTxnId: String(corporateTxnId), 
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
            corporateTxnId,
          },
          transaction: t,
        }
      );
      return true;
    });
  } catch (err) {
    console.log(err.message);
  }
};

exports.refundWalletTransaction = async (meta) => {
  const { corporateTxnId, registeredById } = meta;
  delete meta.corporateTxnId;
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
      // F-OAB-22: read the refund-state row under the transaction's row lock so two concurrent
      // refunds of the same txn serialise here — the second then sees REFUNDED and bails out.
      const data = await walletTransaction.findOne({
        where: {
          corporateTxnId,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
        raw: true,
      });
      if (data) {
        if (data.remarks.indexOf("REFUND") === 0) {
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
          /*
                      Initializing Corporate Transaction
                    */
          data.transactionDate = tranDate;
          data.balance =
            parseFloat(corporateWalletData.balance) +
            parseFloat(data.debitAmount) -
            parseFloat(data.creditAmount);
          data.debitAmount *= -1;
          data.creditAmount *= -1;
          data.corporateCashback *= -1;
          data.systemCashback *= -1;
          data.remarks = tranStatus;

          newTranData = data;

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
          updatedOrderData.status = meta.hasOwnProperty("status")
            ? meta.status
            : "REFUNDED";
          updatedOrderData.message = meta.hasOwnProperty("message")
            ? meta.message
            : "REVERSAL";
            if (Object.prototype.hasOwnProperty.call(meta, 'orderResponse')) {
              updatedOrderData.orderResponse = meta.orderResponse
          }
          await order.update(updatedOrderData, {
            where: {
              corporateTxnId: String(corporateTxnId),
            },
            transaction: t,
          });
          await walletTransaction.update(
            {
              remarks: oldTranStatus,
              status: updatedOrderData.status,
            },
            {
              where: {
                corporateTxnId,
                remarks: {
                  [Op.ne]: tranStatus,
                },
              },
              transaction: t,
            }
          );
          let paymentModeResponseDetails = await order.findOne({
            where: {
              corporateTxnId,
            },
            attributes: ["paymentModeResponse"],
          });
          if (paymentModeResponseDetails) {
            let dapiDetails = JSON.parse(
              paymentModeResponseDetails.paymentModeResponse
            );
            if (
              dapiDetails &&
              dapiDetails["dapiAmount"] &&
              dapiDetails["dapiAmount"] > 0
            )
              await transferFund(
                {
                  credentialId: data.credentialId,
                  amount: dapiDetails["dapiAmount"],
                  remarks: "DAPI REFUND " + corporateTxnId,
                  type: "Credit",
                  registeredById,
                },
                t
              );
            if (
              dapiDetails &&
              dapiDetails["pgAmount"] &&
              dapiDetails["pgAmount"] > 0
            )
              await transferFund(
                {
                  credentialId: data.credentialId,
                  amount: dapiDetails["pgAmount"],
                  remarks: "PG REFUND " + corporateTxnId,
                  type: "Credit",
                  registeredById,
                },
                t
              );
          }
          await t.commit();
          let walletDetails = {
            corporateBalance: newTranData.balance,
          };
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
