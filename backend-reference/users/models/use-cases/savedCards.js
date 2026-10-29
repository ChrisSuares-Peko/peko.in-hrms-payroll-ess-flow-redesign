const SavedCards = require("./../entities/savedCards");
const asyncHandler = require("../../middlewares/async");

exports.findUserCard = asyncHandler(async (params) => {
  try {
    const userCard = await SavedCards.findOne({
      where: {
        corporateUserId: params.corporateId,
        is_default: true,
      },
      attributes: ["maskedPan", "expiry", "scheme"],
      raw: true,
      nest: true,
    });
    return userCard;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return false;
  }
});

exports.findAllSavedCards = asyncHandler(async (corporateId) => {
  try {
    const userCards = await SavedCards.findAll({
      where: {
        corporateUserId: corporateId,
      },
      attributes: [
        "id",
        "maskedPan",
        "expiry",
        "scheme",
        "cardholderName",
        "is_default",
      ],
      raw: true,
      nest: true,
      order: [["is_default", "DESC"]],
    });

    if (!userCards) return false;

    const result = userCards.map((card) => ({
      ...card,
      is_default: !!card.is_default,
    }));
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
});

exports.changeDefaultCard = asyncHandler(async (params) => {
  try {
    const { corporateId, cardId } = params;

    // Remove the previous default card
    await SavedCards.update(
      { is_default: false },
      {
        where: { is_default: true, corporateUserId: corporateId },
      }
    );

    const [affectedRows] = await SavedCards.update(
      { is_default: true },
      {
        where: { id: cardId, corporateUserId: corporateId },
      }
    );
    return affectedRows > 0;
  } catch (error) {
    console.error(error);
    return false;
  }
});
