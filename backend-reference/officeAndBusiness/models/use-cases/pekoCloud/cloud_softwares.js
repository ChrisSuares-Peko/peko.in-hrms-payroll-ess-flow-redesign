const ErrorResponse = require("../../../utils/error-response");
const cloud_softwares = require("../../entities/pekoCloud/cloud_softwares");

exports.findSoftwaresList = async () => {
  try {
      const softwaresData = await cloud_softwares.findAndCountAll();
    
      return { success: true, data: softwaresData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};
