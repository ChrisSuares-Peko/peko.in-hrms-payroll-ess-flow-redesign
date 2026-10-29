const SavedCards = require('./../entities/savedCards')
const asyncHandler = require('../../middlewares/async')

exports.saveNewCardDetails = asyncHandler(async (params) => {
   
    const whereClause = {
        cardToken: params.cardToken
    };

    if (params.corporateUserId) {
        whereClause.corporateUserId = params.corporateUserId;
    } else if (params.subCorporateUserId) {
        whereClause.subCorporateUserId = params.subCorporateUserId;
    }

    // Check if a card with the same card_token already exists for the user
    const existingCard = await SavedCards.findOne({
        where: whereClause
    });

    if (existingCard) {
        return;
    }

    // Define the where clause for checking default card based on provided parameters
    const defaultCardWhereClause = {};

    if (params.corporateUserId) {
        defaultCardWhereClause.corporateUserId = params.corporateUserId;
    } else if (params.subCorporateUserId) {
        defaultCardWhereClause.subCorporateUserId = params.subCorporateUserId;
    }

    defaultCardWhereClause.is_default = true;

    // Check if user already has a default card
    const existingDefaultCard = await SavedCards.findOne({
        where: defaultCardWhereClause
    });

    let savedCard;

    if (existingDefaultCard) {
        savedCard = await SavedCards.create({
            ...params,
            is_default: false
        });
    } else {
        savedCard = await SavedCards.create({
            ...params,
            is_default: true
        });
    }

    return savedCard;
});

exports.findOneSavedCard = asyncHandler(async (params) => {

    const card = await SavedCards.findOne({
        where: {
            ...params,
            is_default: true
        },
        attributes: {
            exclude: ['is_default', 'createdAt', 'updatedAt', 'id']
        },
        raw: true,
        nest: true,
    });

    return card;
})