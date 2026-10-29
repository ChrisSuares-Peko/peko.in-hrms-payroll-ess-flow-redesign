const asyncHandler = require("../middlewares/async");
const {
  findAllSavedCards,
  changeDefaultCard,
} = require("../models/use-cases/savedCards");
const { customLog } = require("../utils/loggerHelper");


exports.listSavedCards = asyncHandler(async (req, res) => {
  try {
    const corporateId = req.user.corporateId;

    const allUserCards = await findAllSavedCards(corporateId);

    if (!allUserCards) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch saved cards",
        data: {},
        responseCode: "001",
      });
    }
    const currentDefaultCard = allUserCards.find((card) => card.is_default);

    return res.status(200).json({
      status: true,
      message: "Saved cards fetched successfully",
      data: {
        allUserCards: allUserCards,
        defaultCard: currentDefaultCard,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateDefaultCard = asyncHandler(async (req, res) => {
  try {
    const corporateId = req.user.corporateId;
    const cardId = req.params.id;

    const isUpdated = await changeDefaultCard({ corporateId, cardId });

    if (!isUpdated) {
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {},
        responseCode: "001",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Default card updated successfully.",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});
