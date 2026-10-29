const connections = require("../entities/connections");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const credential = require("../entities/credential");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime, capitalizeCase } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");

exports.findAllConnections = asyncHandler(async (params) => {
  try {
    let { limit, offset, sort, searchText, sortField, registeredBy, from, to, corporateId, partnerId } = params;

    let order = handleSortFields(sortField, sort)
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    let whereClause = {}
    if (registeredBy)
      whereClause.registeredBy = registeredBy

    if (corporateId) {
      whereClause.id = corporateId
    }
    if (partnerId === 'default') {
      whereClause.registeredBy = null;
    } else if (partnerId) {
      whereClause.registeredBy = Number(partnerId);

    }
    return await connections.findAndCountAll({
      attributes: ['id', 'name', 'email', 'mobile', 'createdAt', 'requirement', 'serviceProvider', 'preferredMode'],
      include: [
        {
          model: credential,
          attributes: ["username", 'registeredBy'],
          where: whereClause,
          include: [
            {
              model: credential, // Referencing the same `credential` model
              as: 'registeredByCredential', // Alias for the registeredBy relation
              attributes: ['name'], // Assuming 'username' is the name field
            }
          ],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [from, tomorrow]
        },
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            name: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            mobile: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            email: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            requirement: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            serviceProvider: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            '$credential.username$': {
              [Op.like]: '%' + searchText + '%',
            },
          },
        ],
      },
      order: order,
      limit,
      offset,
      raw: true,
      nest: true
    });
  } catch (error) {
    customLog(
      null,
      "error",
      {
        error: error,
      },

    );
    throw { message: 'Something went wrong' };
  }
});

exports.connectionExcelCSVData = asyncHandler(async (params) => {
  try {
    let {
      sort,
      searchText,
      sortField,
      registeredBy,
      from,
      to
    } = params
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    let order = handleSortFields(sortField, sort)

    let whereClauseCredential = {}
    if (registeredBy)
      whereClauseCredential.registeredBy = registeredBy

    const data = await connections.findAndCountAll({
      include: [
        {
          model: credential,
          attributes: ["username"],
          where: whereClauseCredential,
          include: [
            {
              // Self-reference join to get the name of the registeredBy user
              model: credential, // Referencing the same `credential` model
              as: 'registeredByCredential', // Alias for the registeredBy relation
              attributes: ['name'], // Assuming 'username' is the name field
            }
          ],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [from, tomorrow]
        },
        [Op.or]: [{
          id: {
            [Op.like]: '%' + searchText + '%'
          }
        }, {
          name: {
            [Op.like]: '%' + searchText + '%'
          }
        }, {
          mobile: {
            [Op.like]: '%' + searchText + '%'
          }
        }, {
          email: {
            [Op.like]: '%' + searchText + '%'
          }
        }, {
          requirement: {
            [Op.like]: '%' + searchText + '%'
          }
        }, {
          serviceProvider: {
            [Op.like]: '%' + searchText + '%'
          }
        }, {
          '$credential.username$': {
            [Op.like]: '%' + searchText + '%',
          },
        }]
      },
      order: order,
      raw: true,
      nest: true
    })
    let finalData = []
    data.rows.forEach(function (limitData) {
      finalData.push({
        "Request Date": limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
        "Request ID": limitData.id ? limitData.id : 'Not Available',
        "Corporate ID": limitData.credential?.username ? limitData.credential?.username : 'Not Available',
        "Corporate Name": limitData.name ? limitData.name : 'Not Available',
        "Partner Name": limitData.credential?.registeredByCredential?.name ? limitData.credential?.registeredByCredential?.name : "Not Available",
        "Mobile Number": limitData.mobile ? limitData.mobile : 'Not Available',
        "Email ID": limitData.email ? limitData.email : 'Not Available',
        "Preferred Mode": limitData.preferredMode ? capitalizeCase(limitData.preferredMode) : 'Not Available',
        Requirements: limitData.requirement ? limitData.requirement : 'Not Available',
        "Service Provider": limitData.serviceProvider ? limitData.serviceProvider : 'Not Available',
      })
    })
    return finalData
  } catch (error) {
    customLog(
      null,
      "error",
      {
        error: error,
      },

    );
    throw { message: 'Something went wrong' };
  }
})

// exports.getExcelCSVData = asyncHandler(async (params) => {
//     let data = await peko_connect.findAll({
//         attributes: ['serviceProvider', 'address', 'category', 'description', 'status'],
//         order: [
//             ['createdAt', 'DESC']
//         ],
//         raw: true,
//     })
//     let finalData = []
//     data.forEach(function (limitData) {
//         finalData.push({
//             'Service Provider': limitData.serviceProvider ? limitData.serviceProvider : 'Not Available',
//             'Address': limitData.address ? limitData.address : 'Not Available',
//             'Category': limitData.category ? limitData.category : 'Not Available',
//             'Status': limitData.status !== false ? (limitData.status ? 'Active' : 'Inactive') : 'Not Available',
//         })
//     })
//     return finalData
// })
