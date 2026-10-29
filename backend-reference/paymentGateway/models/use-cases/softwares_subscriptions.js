const asyncHandler = require("../../middlewares/async");
const { uploadFile } = require("../../utils/commonUploadFile");
const softwares_subscriptions = require("../entities/softwares_subscriptions");

exports.update = asyncHandler(async (params, data) => {
    try {
      if (Object.prototype.hasOwnProperty.call(data, "image") && data.imageFormat) {
        const filePath = `softwares_subscriptions/products`
        const publicUrl = await uploadFile(data.image, filePath, data.imageFormat);
        data.image = publicUrl;
      }
  
      if (Object.prototype.hasOwnProperty.call(data, "sold_quantity")) {
        // Retrieve the current sold_quantity value from the database
        const software = await softwares_subscriptions.findOne({
          where: { id: params.id },
        });
        // Update the data object to increment the sold_quantity value by 1
        data.sold_quantity = (software.sold_quantity || 0) + data.sold_quantity
      }
  
      return await softwares_subscriptions.update(data, {
        where: {
          id: params.id,
        },
      });
    } catch (error) {
      console.log(error.message);
      return false;
    }
  });