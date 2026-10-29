const { createTransaction, findOneTransaction, findAllTransaction, updateTransaction, deleteTransaction } = require('../../models/use-cases/transaction')

exports.createTransaction = async (req) => {
  await createTransaction(req);
};

exports.findOneTransaction = async (req) => {
    await findOneTransaction(req);
};

exports.findAllTransaction = async (req) => {
    await findAllTransaction(req);
};  

exports.updateTransaction = async (req) => {
    await updateTransaction(req);
};

exports.deleteTransaction = async (req) => {
    await deleteTransaction(req);
};