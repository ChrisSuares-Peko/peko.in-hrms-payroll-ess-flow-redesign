const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const axios = require('axios');
const { customLog } = require('./loggerHelper');


exports.checkSaveCardExists = async (corporateUserId) => {
  const query = `
      SELECT * FROM saved_cards
      WHERE corporateUserId = ${corporateUserId} AND is_default = true
      LIMIT 1 
      `;
  const results = await sequelizeConfig.query(query, {
    type: Sequelize.QueryTypes.SELECT,
  });
  return results.length > 0 ? results[0] : null;
};

exports.getAccessTokenForAutoPay = async () => {
  return false;
};

exports.findServiceOperatorByAccessKey = async (accessKey) => {
  let query = `
  SELECT 
      serviceOperators.*, 
      vendors.apiUrl, 
      vendors.optional1, 
      vendors.optional2, 
      vendors.optional3, 
      vendors.optional4, 
      vendors.optional5, 
      vendors.healthUrl
  FROM 
      serviceOperators
  JOIN 
      vendors ON serviceOperators.vendorId = vendors.id
  WHERE 
      serviceOperators.accessKey = :accessKey
  `;
  query += " LIMIT 1";
  const replacements = { accessKey };
  const results = await sequelizeConfig.query(query, {
    replacements,
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
    nest: true,
  });
  if (results.length === 0) {
    return { error: "Service is not available" };
  } else {
    return results[0];
  }
};

exports.createAutoPay = async (vendorData, paymentDetails, userCard) => {
  const { vendorUrl, outletReference, accessToken } = vendorData;

  const { subscriptionPrice, name, email, city } = paymentDetails;
  // create order using tokenisation method
  const config = {
    method: "POST",
    url: `${vendorUrl}/transactions/outlets/${outletReference}/orders`,
    headers: {
      "Content-Type": "application/vnd.ni-payment.v2+json",
      Accept: "application/vnd.ni-payment.v2+json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      action: "PURCHASE",
      amount: {
        currencyCode: "INR",
        value: parseFloat(subscriptionPrice),
      },
      emailAddress: email,
      billingAddress: {
        firstName: name,
        city: city,
        countryCode: "AE",
      },
      merchantAttributes: {
        skip3DS: true,
      },
      skipConfirmationPage: true,
    },
  };
  try {
    const response = await axios.request(config);
    const responseData = response.data;
    if (
      responseData.reference &&
      Object.prototype.hasOwnProperty.call(responseData._embedded, "payment")
    ) {
      const paymentLinks = responseData._embedded.payment[0];
      const tokenPaymentUrl = paymentLinks._links["payment:saved-card"].href;
      // final api call for payment
      const config = {
        method: "PUT",
        url: tokenPaymentUrl,
        headers: {
          "Content-Type": "application/vnd.ni-payment.v2+json",
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          ...userCard,
          recaptureCsc: false,
        },
      };
      const response = await axios.request(config);
      customLog(null, "info", { message: "Auto renewal response received", dataKeys: Object.keys(response.data || {}) });
      await this.saveVendorResponse(config.data, response.data || {});
      return response.data;
    }
    await this.saveVendorResponse(config.data, responseData || {});
    return false;
  } catch (error) {
    customLog(null, "error", { error, message: "Auto renewal error" });
    await this.saveVendorResponse(config.data, error?.response?.data || {});
    return false;
  }
};

exports.saveVendorResponse = async (vendorPayload, vendorResponse) => {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS autoRenewalReport (
          id INT AUTO_INCREMENT PRIMARY KEY,
          vendorPayload JSON,
          vendorResponse JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
  `;

  // Execute the create table query
  await sequelizeConfig.query(createTableQuery);

  // Prepare the insert query
  const insertQuery = `
      INSERT INTO autoRenewalReport (vendorPayload, vendorResponse)
      VALUES (:vendorPayload, :vendorResponse);
  `;

  // Execute the insert query
  await sequelizeConfig.query(insertQuery, {
    replacements: {
      vendorPayload: JSON.stringify(vendorPayload), // Convert to string if necessary
      vendorResponse: JSON.stringify(vendorResponse), // Convert to string if necessary
    },
    type: Sequelize.QueryTypes.INSERT,
  });
};
