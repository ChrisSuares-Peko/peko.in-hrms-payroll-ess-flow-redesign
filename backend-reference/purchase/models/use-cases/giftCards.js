const giftCards = require("../../models/entities/giftCards");
const sequelize = require("../../configs/database/index");
const vendor = require("../entities/vendor");
const serviceOperator = require("../entities/serviceOperator");

const asyncHandler = require("../../middlewares/async");
const { Op } = require("sequelize");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFile } = require("../../utils/commonUploadFile");
const { PLAN_COMMISSION, reviewedChange } = require("../../utils/configuredFlag");

const uploadAndSetImage = async (params, paramName, folderName) => {
  if (params[paramName] && params[paramName] instanceof Object) {
    const { imageBase, imageFormat } = params[paramName];
    const filePath = `${folderName}/${paramName}`;
      params[paramName] = await uploadFile(imageBase, filePath, imageFormat);
  }
};

exports.create = async (params) => {
  try {

    await uploadAndSetImage(params, "brand_logo", "GiftCards");

    const giftCard = await giftCards.create(params);

    if (!giftCard) {
      return false;
    }

    return giftCard;
  } catch (error) {
    console.error("Gift card creation failed:", error);
    return false;
  }
};


exports.bulkCreate = async (params) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    // No image upload needed, image URL comes from Excel
    const giftCard = await giftCards.bulkCreate(params, { transaction });

    if (!giftCard) {
      await transaction.rollback();
      return false;
    }

    await transaction.commit();
    return giftCard;
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Bulk gift card creation failed:", error);
    return false;
  }
};

exports.findByAnyField = asyncHandler(async (query) => {
  return await giftCards.findOne({
    // include: [{
    //     model: serviceOperators,
    //     as: 'serviceOperator',
    //     attributes: ['accessKey']
    // }],
    where: query,
  });
});

exports.findSingleGiftCard = asyncHandler(async (giftCardId, { includeCommission = false } = {}) => {
  return await giftCards.findOne({
    include: [
      {
        model: serviceOperator,
        as: "serviceOperator",
        attributes: ["accessKey"],
      },
    ],
    where: {
      id: giftCardId,
    },
    attributes: {
      exclude: ["createdAt", "updatedAt", ...(includeCommission ? [] : [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag])],
    },
  });
});


exports.update = asyncHandler(async (id, params) => {
  await uploadAndSetImage(params, "brand_logo", "GiftCards");
  const reviewed = await reviewedChange({
    load: () => giftCards.findOne({ where: { id }, attributes: PLAN_COMMISSION.fields, raw: true }),
    incoming: params,
    group: PLAN_COMMISSION,
    table: "giftCards",
    id,
  });
  return await giftCards.update(reviewed, {
    where: {
      id: id,
    },
  });
});

exports.updateStatusByServiceOperatorId = asyncHandler(async (serviceOperatorId, params) => {
  return await giftCards.update(params, {
    where: {
      serviceOperatorId: serviceOperatorId,
    },
  });
});

exports.findAllGiftCardIdsByServiceOperatorId = asyncHandler(async (serviceOperatorId) => {
  const giftCardsData = await giftCards.findAll({
    where: {
      serviceOperatorId: serviceOperatorId,
    },
  });

  // Convert the result to a Map
  const giftCardMap = new Map(giftCardsData.map((giftCard) => [giftCard.product_id, giftCard]));

  return giftCardMap;
});

const KNOWN_GIFT_CARD_CATEGORIES = [
  "Fashion and Lifestyle",
  "Food and Restaurant",
  "Travel and Entertainment",
  "Electronics",
  "Grocery",
  "Wellness and Sports",
  "Gold and Jewellery",
  "Gaming",
];

exports.findAllGiftCard = async (params) => {
  try {
    const { offset, limit, accessKeys, searchText, sortMethod, popularCards, category } = params;

    let column;
    let order;

    if (sortMethod === "popular") {
      column = "sold_quantity";
      order = "DESC";
    } else {
      // "all", "name", and anything else default to alphabetical — "All" is a
      // brand-listing view, not "unsorted"/creation-order, so it should read the
      // same A-Z order as explicitly picking "Name" from the sort dropdown.
      column = "product_name";
      order = "ASC";
    }

    let whereClauseProducts = {
      status: true,
      isAccessible: true,
    };

    if (searchText) {
      whereClauseProducts[Op.or] = [
        { product_name: { [Op.like]: "%" + searchText + "%" } },
        { product_id: { [Op.like]: "%" + searchText + "%" } },
      ];
    }

    if (popularCards && popularCards.length > 0) {
      whereClauseProducts.id = { [Op.in]: popularCards };
    }

    if (category && category.toLowerCase() !== "all") {
      const STOP_WORDS = new Set(['and', 'or', 'the', 'of', 'for', 'in', 'a', '&']);
      const extractWords = (str) =>
        str.split(/[\s,&]+/)
          .map(w => w.trim())
          .filter(w => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()))
          .map(w => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));

      if (category.toLowerCase() === "others") {
        const knownWords = [...new Set(KNOWN_GIFT_CARD_CATEGORIES.flatMap(extractWords))];
        const othersConditions = knownWords.map(w => ({
          [Op.or]: [
            { category: null },
            { category: { [Op.notLike]: `%${w}%` } },
          ],
        }));
        whereClauseProducts[Op.and] = (whereClauseProducts[Op.and] || []).concat(othersConditions);
      } else {
        const words = extractWords(category);
        if (words.length > 0) {
          whereClauseProducts[Op.and] = (whereClauseProducts[Op.and] || []).concat({
            [Op.or]: words.map(w => ({ category: { [Op.like]: `%${w}%` } })),
          });
        }
      }
    }

    const queryOptions = {
      include: [
        {
          model: serviceOperator,
          as: "serviceOperator",
          attributes: ["accessKey"],
          where: {
            accessKey: {
              [Op.in]: accessKeys,
            },
          },
        },
      ],
      offset,
      limit,
      raw: true,
      nest: true,
      // TRIM guards against a stray leading/trailing space or control character in
      // product_name (invisible in the rendered UI) sorting that row before all
      // digits/letters instead of where its actual name belongs.
      order: sortMethod === "popular"
        ? [[column, order]]
        : [[sequelize.literal('LOWER(TRIM(`giftCards`.`product_name`))'), "ASC"]],
      where: whereClauseProducts,
      subQuery: false,
      distinct: true,
    };

    const result = await giftCards.findAndCountAll(queryOptions);
    console.log("result here",result)
    result.rows = result.rows.map((row) => {
      return {
        ...row,
        status: row.status === 1,
      };
    });

    return result;
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error: error });
  } finally {
    console.log("PRODUCT FIND ALL ROUTE CALLED");
  }
};


exports.findAllGiftCards = asyncHandler(async (params) => {
  let { limit, offset, searchText, sort, sortField } = params;
  let order = handleSortFields(sortField, sort);
  return await giftCards.findAndCountAll({
    where: {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          product_name: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          product_id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          brand_name: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    },
    order: order,
    limit,
    offset,
  });
});

exports.giftCardsAndCountExport = asyncHandler(async (params) => {
  try {
    let { sort, sortField } = params;
    let order = handleSortFields(sortField, sort);

    const rows = await giftCards.findAll({
      include: [
        {
          model: serviceOperator,
          as: "serviceOperator",
          attributes: ["id", "serviceProvider"],
        },
      ],
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = [];
    rows.forEach(function (limitData) {
      const denominations =
        limitData.denominations && limitData.denominations.length > 0
          ? limitData.denominations.join(", ")
          : "-";
      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
        Name: limitData.product_name || "Not Available",
        "Price Type": limitData.priceType || "Not Available",
        Denominations: limitData.priceType === "FIXED" ? denominations : "-",
        "Price Range": `Min: ₹ ${limitData.min_price ?? "0.00"} - Max: ₹ ${limitData.max_price ?? "0.00"}`,
        "Sold Quantity": limitData.sold_quantity ?? 0,
        Vendor: `Gift Cards (${limitData.serviceOperator?.serviceProvider ?? limitData.serviceOperatorId ?? "-"})`,
      });
    });
    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

exports.getExcelCSVData = asyncHandler(async () => {
  let data = await giftCards.findAll({
    attributes: ["id", "name", "priceType", "minDenomination", "maxDenomination", "currency"],
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  let finalData = [];
  data.forEach(function (limitData) {
    finalData.push({
      "GiftCard Id": limitData.id,
      "GiftCard Name": limitData.name,
      "Price Type": limitData.priceType,
      "Price Range": `Min: ${limitData.minDenomination} - Max: ${limitData.maxDenomination}`,
      Currency: limitData.currency ? limitData.currency : "Not Available",
    });
  });
  return finalData;
});

exports.findVendorById = asyncHandler(async (venderId) => {
  return await vendor.findOne({
    where: {
      id: venderId,
    },
  });
});
exports.findServiceOperatorById = asyncHandler(async (serviceOperatorId) => {
  return await serviceOperator.findOne({
    include: [
      {
        model: vendor,
        as: "vendor",
      },
    ],
    where: {
      id: serviceOperatorId,
    },
  });
});
exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey) => {
  return await serviceOperator.findOne({
    include: [
      {
        model: vendor,
        as: "vendor",
      },
    ],
    where: {
      accessKey: accessKey,
    },
  });
});

exports.updateAllStatus = asyncHandler(async (params) => {
  return await giftCards.update(params, {
    where: {},
  });
});
