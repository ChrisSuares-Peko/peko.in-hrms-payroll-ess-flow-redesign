const softwares = require("../entities/softwares");
const asyncHandler = require("../../middlewares/async");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.update = asyncHandler(async (params, data, user) => {
  try {
    if (Object.prototype.hasOwnProperty.call(data, "image") && data.imageFormat) {
      const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"
      }/${user?.username ? user?.username : "unknown-user"}/softwares/image`
      const publicUrl = await uploadFile(data.image, filePath, data.imageFormat);
      data.image = publicUrl;
    }

    if (Object.prototype.hasOwnProperty.call(data, "sold_quantity")) {
      // Retrieve the current sold_quantity value from the database
      const software = await softwares.findOne({
        where: { id: params.id },
      });
      // Update the data object to increment the sold_quantity value by 1
      data.sold_quantity = (software.sold_quantity || 0) + data.sold_quantity
    }

    return await softwares.update(data, {
      where: {
        id: params.id,
      },
    });
  } catch (error) {
    console.log(error.message);
    return false;
  }
});