const business_email_subscriptions = require("../entities/businessEmail")


exports.create = async (data, transaction) => {
    return await business_email_subscriptions.create(data, {transaction}); 
}