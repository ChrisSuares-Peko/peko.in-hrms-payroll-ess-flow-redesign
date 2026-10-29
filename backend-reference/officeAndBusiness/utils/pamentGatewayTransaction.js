/* eslint-disable no-unused-vars */
const orders = require("./../models/use-cases/order");
const order = require("./../models/entities/order");
const wallet = require("./../models/entities/wallet");
const walletTransaction = require("./../models/entities/transaction");
const sequelizeConfig = require("./../configs/database/index");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");
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
      payCashback,
      orderAmount,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      pgResponse,
      pgAmount,
      transactionCategory,
      surcharge,
      reportData,
    } = data;
    // F-OAB-04: gateway amounts are verified only in the paymentGateway service; an amount
    // asserted by the client here is unverified, so reject any non-zero contribution
    // (otherwise it could credit the wallet or settle an order for free).
    if (!(parseFloat(pgAmount) >= 0) || parseFloat(pgAmount) > 0) {
      return { error: "Payment method not supported" };
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
          (parseFloat(orderAmount) +
            parseFloat(surcharge) -
            parseFloat(pgAmount)) +
          parseFloat(corporateCashback)
      ).toFixed(4);
      console.log("---------------PG---------------");
      console.log("Corporate Initial Balance", walletDetails["balance"]);
      console.log("Amount", orderAmount);
      console.log("PG Amount", pgAmount);
      console.log("Corporate Cashback", corporateCashback);
      console.log("Corporate Final Balance", corporateFinalBalance);
      console.log("----------------PG--------------");
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
          amountInINR: parseFloat(orderAmount) + parseFloat(surcharge),
          baseAmount: parseFloat(orderAmount) + parseFloat(surcharge),
          baseCurrency: "INR",
          exchangeRate: 1,
          status: "PENDING",
          paymentMode:
            parseFloat(orderAmount) +
              parseFloat(surcharge) -
              parseFloat(pgAmount) !=
            0
              ? "PG + WALLET"
              : "PG",
          paymentModeResponse: JSON.stringify({
            ...pgResponse,
            pgAmount,
          }),
          accountNo,
          surcharge,
          message: "",
          serviceOperatorId,
          credentialId,
          ...reportData,
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
          debitAmount:
            parseFloat(orderAmount) +
            parseFloat(surcharge) -
            parseFloat(pgAmount),
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
        error: "INSUFFICIENT WALLET BALANCE",
      };
    } else {
      return {
        error: "Internal server error",
      };
    }
  }
};

exports.createPaytmTransaction = async (data) => {
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
      orderAmount,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      paytmResponse,
      paytmAmount,
      transactionCategory,
      surcharge,
      reportData,
    } = data;
    // F-OAB-04: gateway amounts are verified only in the paymentGateway service; an amount
    // asserted by the client here is unverified, so reject any non-zero contribution
    // (otherwise it could credit the wallet or settle an order for free).
    if (!(parseFloat(paytmAmount) >= 0) || parseFloat(paytmAmount) > 0) {
      return { error: "Payment method not supported" };
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
          (parseFloat(orderAmount) +
            parseFloat(surcharge) -
            parseFloat(paytmAmount)) +
          parseFloat(corporateCashback)
      ).toFixed(4);
      console.log("---------------Paytm Payment---------------");
      console.log("Corporate Initial Balance", walletDetails["balance"]);
      console.log("Amount", orderAmount);
      console.log("Paytm Amount", paytmAmount);
      console.log("Corporate Cashback", corporateCashback);
      console.log("Corporate Final Balance", corporateFinalBalance);
      console.log("----------------Paytm Payment--------------");
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
          amountInINR: parseFloat(orderAmount) + parseFloat(surcharge),
          baseAmount: parseFloat(orderAmount) + parseFloat(surcharge),
          baseCurrency: "INR",
          exchangeRate: 1,
          status: "PENDING",
          paymentMode:
            parseFloat(orderAmount) +
              parseFloat(surcharge) -
              parseFloat(paytmAmount) !=
            0
              ? "PAYTM + WALLET"
              : "PAYTM",
          paymentModeResponse: JSON.stringify({
            ...paytmResponse,
            paytmAmount,
          }),
          accountNo,
          surcharge,
          message: "",
          serviceOperatorId,
          credentialId,
          ...reportData,
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
          debitAmount:
            parseFloat(orderAmount) +
            parseFloat(surcharge) -
            parseFloat(paytmAmount),
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
        error: "INSUFFICIENT WALLET BALANCE",
      };
    } else {
      return {
        error: "Internal server error",
      };
    }
  }
};
