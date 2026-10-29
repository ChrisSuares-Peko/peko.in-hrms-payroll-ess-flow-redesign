const { findOneServiceOperator } = require("../../models/use-cases/serviceOperator");
const { getToken } = require("../../utils/tunzAuth");
const axios = require("axios");
const operatorsData = require("../../utils/operatorsData.json");

exports.getSupportedDevices = async (req, res) => {
  try {
      const accessKey = operatorsData.eSIMTunz.accessKey;
  
      const serviceDetails = await findOneServiceOperator({ accessKey });
  
      if (!serviceDetails || !serviceDetails.vendor) {
        throw new Error("Tunz service configuration not found");
      }
  
      const token = await getToken(serviceDetails.vendor, accessKey);
  
      if (!token) {
        throw new Error("Failed to generate Tunz token");
      }
  
      const response = await axios.get(
        `${serviceDetails.vendor.apiUrl}/esim/device/esim-capable`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      );
  
    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch supported devices"
    });
  }
};