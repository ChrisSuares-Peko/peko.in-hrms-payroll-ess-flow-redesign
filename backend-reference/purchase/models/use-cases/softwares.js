const softwares = require("../entities/softwares");
const vendors = require("../entities/vendor");
const category = require('../entities/categories');

const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime } = require("../../utils/formatter");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.create = asyncHandler(async (params) => {
  if (!params.productId || !params.name || !params.description || !params.features) {
    return false;
  }
  try {
    if (Object.prototype.hasOwnProperty.call(params, "image") && params.imageFormat) {
      const filePath = `softwares/${params.categoryName ? params.categoryName : "others"}`
        const publicUrl = await uploadFile(params.image, filePath, params.imageFormat);
        params.image = publicUrl;
    }
    return await softwares.create(params);
  } catch (error) {
    console.log(error.message);
    return false;
  }
});

exports.findProduct = asyncHandler(async (params) => {
  if (Object.keys(params).length === 0) {
    throw new Error('No search criteria provided');
  }
  return await softwares.findOne({
      where: params
  })
})

exports.find = asyncHandler(async (name) => {
  return await softwares.findOne({
      where: {
          name: name
      }
  })
})

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

exports.Delete = asyncHandler(async (params) => {
  if(!params.productCode) {
    throw new Error("Invoice product code")
  }
  return await softwares.destroy({
    where: {
      id: params.productCode,
    },
  });
});

exports.findByProductId = asyncHandler(async (productId) => {
  if (!productId) {
    throw new Error('Invalid productId'); 
  }
  return await softwares.findOne({
    where: {
      productId: productId,
    },
  });
});

exports.findAllSoftwares = asyncHandler(async (params) => {
  let { limit, offset, searchText, sort, sortField } = params

    let order = handleSortFields(sortField, sort)

  return await softwares.findAndCountAll({
    include: [
      {
        model: vendors,
        attributes: ["vendorName", "optional1"],
      },
    ],
    where: {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          productId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          name: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          description: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          features: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          pekoEmail: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          typeOfOrder: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    },
    order: order,
    limit,
    offset,
    raw: true,
    nest: true,
  });
});

exports.softwareAndCountExport = asyncHandler(async (params) => {
  try{
    let { searchText, sort, sortField } = params;
    let order = handleSortFields(sortField,sort)

    const data = await softwares.findAndCountAll({
      include: [
        {
          model: vendors,
          attributes: ["vendorName", "optional1"],
        },
      ],
      where: {
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            productId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            name: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            description: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            features: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            pekoEmail: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            typeOfOrder: {
              [Op.like]: "%" + searchText + "%",
            },
          },
        ],
      },
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = []
      data.rows.forEach(function (limitData) {
          finalData.push({
              Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
              Image: limitData.image ? limitData.image : "Not Available",
              Name: limitData.name ? limitData.name : "Not Available",
              "Type": limitData.typeOfOrder ? limitData.typeOfOrder : "Not Available",
              Status: limitData.status>0 ? "Active"  : "In Active",
              Description: limitData.description ? limitData.description : "Not Available",
             
          })
      })
      return finalData
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});

exports.findSoftwares = asyncHandler(async (params, softwareAttributes = undefined, categories) => {
  console.log("🚀 ~ exports.findSoftwares=asyncHandler ~ categories:", categories)
  const { searchText, start = 1, length = 10, sort } = params;

  const pageSize = Math.min(length, 50); // max page size
  const pageNumber = Math.max(start, 1); // ensure page number is at least 1
  let whereClauseCategory = {};
  const offset = (pageNumber - 1) * pageSize;

  let orderCriteria;
  if (sort === "latest") {
    orderCriteria = [["createdAt", "DESC"]];
  } else if (sort === "oldest") {
    orderCriteria = [["createdAt", "ASC"]];
  } else {
    orderCriteria = [["createdAt", "DESC"]];
  }

  if (categories && categories.length > 0) {
    whereClauseCategory = {
        id: {
            [Op.in]: categories
        }
    };
} else {
    whereClauseCategory = {
        categoryStatus: true
    };
}

  const queryOptions = {
    include: [{
      model: category,
      where: whereClauseCategory,
      attributes: ['categoryName', 'id']
  }],
    where: {
      status: true,
    },
    attributes: softwareAttributes,
    offset,
    limit: pageSize,
    order: orderCriteria,
  };
  if (searchText) {
    queryOptions.where.name = {
      [Op.like]: `%${searchText}%`,
    };
  }
  const result = await softwares.findAndCountAll(queryOptions);
  return {
    data: result.rows,
    recordsTotal: result.count,
    recordsFiltered: result.count,
  };
});

exports.findOne = asyncHandler(async (params, attributes = undefined) => {
  if (!params.productCode) {
    throw new Error('Invalid product Code'); 
  }
  return await softwares.findOne({
      where: {
          id: params.productCode
      },
      attributes
  })
})

exports.createBulkSoftwares = asyncHandler(async (params) => {

  const products = await softwares.create(params)

  if (!products) {
      return false;
  }
  return products
})

exports.findSoftwareByName = async (softwareName) => {
  try {
      return await softwares.findOne({
          where: {
              name: softwareName
          },
          raw: true,
      })
  } catch (error) {
      return false
  }
}

exports.fetchSoftwareCategories = async (params) => {
  try {
      const queryOptions = {
          include: [{
              model: vendors,
              attributes: ['id', 'vendorName','type'],
              where: {
                  type: 'SOFTWARE'
              }
          }],
          where: {
              categoryStatus: true
          }
      };
      // Check if a search term is provided
      if (params.searchText && params.searchText.trim() !== '') {
          queryOptions.where = {
              ...queryOptions.where,
              // Add search condition
              categoryName: {
                  [Op.like]: `%${params.searchText.trim()}%`
              }
          };
      }
      return await category.findAll(queryOptions);

  } catch (error) {
      console.log(error)
  } finally {
      console.log("CATEGORY FIND ALL ROUTE CALLED")
  }
}