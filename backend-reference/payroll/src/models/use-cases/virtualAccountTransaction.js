const VirtualAccountTransaction = require('../entities/virtualAccountTransaction');

exports.createVirtualAccountTransaction = async (data) =>
  VirtualAccountTransaction.findOneAndUpdate(
    { referenceId: data.referenceId },
    { $setOnInsert: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

exports.findVirtualAccountTransactionByReferenceId = async (referenceId) =>
  VirtualAccountTransaction.findOne({ referenceId });
