const settings = require("../entities/setting");
const asyncHandler = require("../../middlewares/async");

exports.getSchedulerInterval = asyncHandler(async (settingName) => {
  try {
    const setting = await settings.findOne({
      where: { name: settingName },
    });

    if (!setting) {
      throw new Error("Scheduler configuration not found");
    }

    const details = JSON.parse(setting.details);
    return details.interval || 6;
  } catch (error) {
    console.log("No scheduler interval configured, taking default as 6:", error?.message);
    return 6;
  }
})

exports.findByEmail = asyncHandler(async (params) => {
  return await settings.findOne({
      where: {
          name: params.name
      }
  })
})

exports.getGstDetails = asyncHandler(async () => {
  return await settings.findOne({
    where: { name: "taxRate" },
  });
});

