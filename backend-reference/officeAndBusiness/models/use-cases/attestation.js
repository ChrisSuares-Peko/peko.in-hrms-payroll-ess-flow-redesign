const attestation = require('./../entities/attestation')
const asyncHandler = require('../../middlewares/async')
const {
    Op
} = require("sequelize");
const credential = require('../entities/credential');
const transaction = require('../entities/transaction');
const { handleSortFields } = require('../../utils/sortHandle');
const { formattedDateTime,formatNumberWithLocalString } = require('../../utils/formatter');
const SubCorporateUser = require('../entities/subCorporateUsers');
const orders = require('../entities/order');
const attestationCategory = require('../entities/attestationCategory');


exports.create = asyncHandler(async (params) => {
     return await attestation.create(params)
})

exports.findAllAttestationCount = asyncHandler(async (params) => {
    let {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        corporateId, 
        from, 
        to,
       subCorporateUserId,
       subPartnerId,
       partnerId
    } = params

    let order = handleSortFields(sortField,sort)

    let whereClause = {
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            documentType: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            issuedCountry: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            submissionCountry: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            address: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            '$credential.username$': {
              [Op.like]: '%' + searchText + '%',
            },
        }, {
            '$credential.name$': {
              [Op.like]: '%' + searchText + '%',
            },
        }, {
            status: searchText
        }]
    }
    let whereClauseCredential = {}

    if (partnerId === 'default') {
        whereClauseCredential.registeredBy = null;
           } else if (partnerId) {
        whereClauseCredential.registeredBy = partnerId;
        if(subPartnerId){
          whereClauseCredential.subPartnerId = subPartnerId;
          }
      } 
    if (from && to) {
        let tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
  
        whereClause.createdAt = {
          [Op.between]: [from, tomorrow]
        }
    }


     if (corporateId) {
          whereClause.credentialId = corporateId
     }

     if (subCorporateUserId) {
        whereClause.subCorporateUserId = subCorporateUserId;
    }

    return await attestation.findAndCountAll({
        attributes:['id','createdAt','documentType','amount','passportDoc','status','issuedCountry','submissionCountry','email','contactPersonPhone','address'],
        include: [{
            model: credential,
            attributes: ['id', 'name', 'username'],
            include: [
                {
                  // Self-reference join to get the name of the registeredBy user
                  model: credential, // Referencing the same `credential` model
                  as: 'registeredByCredential', // Alias for the registeredBy relation
                  attributes: ['name'], // Assuming 'username' is the name field
                }
              ],
        },
        {
            model: transaction,
            attributes: ['corporateTxnId', 'status'], 
            include: [{
                model: orders, 
                attributes: ['id', 'amountInINR']
            }]
          },

          {
            model: SubCorporateUser,
            attributes: ['id', 'name'],
            required: false
        }
    ],
        where: whereClause,
        order: order,
        limit,
        offset
    })
})

exports.updateAttestation = asyncHandler(async (params, data) => {
     return await attestation.update(data, {
          where: {
               id: params.id,
          },
     })
})

exports.getExcelCSVData = asyncHandler(async (params) => {

    let {
        from,
        to,
        searchText,
        sort,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        corporateId
    } = params  

    let whereClause = {
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            documentType: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            issuedCountry: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            submissionCountry: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            address: {
                [Op.like]: '%' + searchText + '%'
            }
        },{
            '$credential.username$': {
              [Op.like]: '%' + searchText + '%',
            },
        }, {
            '$credential.name$': {
              [Op.like]: '%' + searchText + '%',
            },
        }]
    }

    if (from && to) {
        let tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
  
        whereClause.createdAt = {
          [Op.between]: [from, tomorrow]
        }
    }

    if (corporateId) {
        whereClause.credential.id = corporateId
    }
    
    let includeOptions =[{
        model: credential,
        attributes: credentialAttribute,
        include: [
            {
              // Self-reference join to get the name of the registeredBy user
              model: credential, // Referencing the same `credential` model
              as: 'registeredByCredential', // Alias for the registeredBy relation
              attributes: ['name'], // Assuming 'username' is the name field
            }
          ],
    },
    {
        model: transaction,
        attributes: transactionAttribute
    }];


    let sortClause
    if (sort) {
      sortClause = [sortField, sort]
    } else {
      sortClause = [sortField, 'ASC']
    }
    
    const data = await attestation.findAndCountAll({
        include: includeOptions,
        where: whereClause,
        order: [
          sortClause
        ],
        attributes: orderAttribute,
        raw: true,
        nest: true
      });


    let finalData = []
    data.rows.forEach(function (limitData) {
        finalData.push({
        "Date":  limitData.createdAt ? formattedDateTime(limitData.createdAt): 'Not Available',
        "Corporate ID": limitData.credential?.username ? limitData.credential?.username : "Not Available",
        "Corporate Name": limitData.credential?.name ? limitData.credential?.name : "Not Available",
        "Partner Name": limitData.credential?.registeredByCredential?.name ? limitData.credential?.registeredByCredential?.name : "Not Available",
        "Document": limitData.documentType ? limitData.documentType : "Not Available",
        "Amount": limitData.amount ? "₹ "+parseFloat(limitData.amount).toFixed(2) : "₹ 0.00",
        "Document Url":  limitData.passportDoc ?  limitData.passportDoc : 'Not Available',
        "Status": limitData.status ? limitData.status  : "Not Available",
        })
    })
  return finalData
})

exports.attestationSingleDetails = asyncHandler(async (params) => {
     return await attestation.findOne({
          include: [
               {
                    model: credential,
                    attributes: ['id', 'name'],
               },
               {
                    model: transaction,
                    attributes: ['corporateTxnId', 'status'],
               },
          ],
          where: {
               id: params.id,
          },
          raw: true, 
          nest: true
     })
})

exports.documentsAndCountExport = asyncHandler(async ({ searchText, sort, sortField,to ,from}) => {
     try {
          let order = handleSortFields(sortField, sort)

          const searchPattern = `%${searchText}%`
            const tomorrow = new Date(to)
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0, 0, 0, 0)
          let whereClause = {
               createdAt: {
                    [Op.between]: [from, tomorrow],
               },
               [Op.or]: [
                    {
                         id: {
                              [Op.like]: searchPattern,
                         },
                    },
                    {
                         documentType: {
                              [Op.like]: searchPattern,
                         },
                    },
                    {
                         issuedCountry: {
                              [Op.like]: searchPattern,
                         },
                    },
                    {
                         submissionCountry: {
                              [Op.like]: searchPattern,
                         },
                    },
                    {
                         address: {
                              [Op.like]: searchPattern,
                         },
                    },
               ],
          }
          const data = await attestation.findAndCountAll({
               include: [
                    {
                         model: credential,
                         attributes: ['id', 'name'],
                    },
               ],
               where: whereClause,
               order: order,
               raw: true,
               nest: true,
          })

          let finalData = []
          data.rows.forEach(function (limitData) {
               finalData.push({
                    Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                    'Corporate Name': limitData.credential ? limitData.credential.name : 'Not Available',
                    'Document Type': limitData.documentType ? limitData.documentType : 'Not Available',
                    'Issued Country': limitData.issuedCountry ? limitData.issuedCountry : 'Not Available',
                    'Submission Country': limitData.submissionCountry ? limitData.submissionCountry : 'Not Available',
                    'Contact No': limitData.contactPersonPhone ? limitData.contactPersonPhone : 'Not Available',
                    Amount: limitData.amount ? limitData.amount : 'Not Available',
                    Status: limitData.status || 'Not Available',
               })
          })
          return finalData
     } catch (error) {
          console.log(error)
          throw { message: 'Something went wrong' }
     }
})


exports.createAttestationCategory = asyncHandler(async (params) => {
    const responseData = await attestationCategory.create(params)
    if (!responseData) {
        return false;
    }
    return responseData
})

exports.updateAttestationCategory = asyncHandler(async (id, params) => {
    const attestation = await attestationCategory.findOne({ where: { id } });
    if (!attestation) {
        return false;
    }

    const updatedAttestation = await attestation.update(params);
    return updatedAttestation;
});

exports.deleteAttestationCategory = asyncHandler(async (id) => {
    const attestation = await attestationCategory.findOne({ where: { id } });
    if (!attestation) {
        return false;
    }

    await attestation.destroy();
    return true;
});
exports.findAttestationCategory = asyncHandler(async (query) => {
    return await attestationCategory.findAll({
        where: query,
        nest: true,
        raw: true
    })
})

exports.findOneAttestationCategory = asyncHandler(async (query) => {
    return await attestationCategory.findOne({
        where: query,
        nest: true,
        raw: true
    })
})

exports.findAllAttestationCategoriesUseCase = asyncHandler(async (params) => {
    let { limit, offset, searchText, sort, sortField, from, to } = params;

    let order = [[sortField, sort]];

    let whereClause = {
        [Op.or]: [
            { id: { [Op.like]: `%${searchText}%` } },
            { label: { [Op.like]: `%${searchText}%` } },
            { value: { [Op.like]: `%${searchText}%` } },
            { country: { [Op.like]: `%${searchText}%` } },
            { price: { [Op.like]: `%${searchText}%` } },
        ],
    };

    if (from && to) {
        let toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        toDate.setHours(0, 0, 0, 0);

        whereClause.createdAt = {
            [Op.between]: [from, toDate],
        };
    }

    return await attestationCategory.findAndCountAll({
        attributes: ["id", "countryCode", "label", "value", "price", "country", "createdAt"],
        where: whereClause,
        order,
        limit,
        offset,
    });
});
exports.findAllAttestationCategoriesExport = asyncHandler(async (params) => {
    let { searchText, sort, sortField, from, to } = params;

    let order = [[sortField, sort]];

    let whereClause = {
        [Op.or]: [
            { id: { [Op.like]: `%${searchText}%` } },
            { label: { [Op.like]: `%${searchText}%` } },
            { value: { [Op.like]: `%${searchText}%` } },
            { country: { [Op.like]: `%${searchText}%` } },
            { price: { [Op.like]: `%${searchText}%` } },
        ],
    };

    if (from && to) {
        let toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        toDate.setHours(0, 0, 0, 0);

        whereClause.createdAt = {
            [Op.between]: [from, toDate],
        };
    }

    const data = await attestationCategory.findAndCountAll({
        attributes: ["id", "countryCode", "label", "value", "price", "country", "createdAt"],
        where: whereClause,
        order,
    });

    let finalData = []
        data.rows.forEach(function (limitData) {
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Label": limitData.label ? limitData.label : "Not Available",
                value: limitData.value? limitData.value: "Not Available",
                Price: limitData.price ? "₹ "  + formatNumberWithLocalString(limitData.price) : "₹ 0.00",
                "country": limitData.country ? limitData.country : "Not Available",
                countryCode: limitData.countryCode ? limitData.countryCode  : "Not Available",
            })
        })
        return finalData
});


exports.fetchUniqueCountries = async (searchText) => {
    const whereClause = searchText
      ? { country: { [Op.like]: `%${searchText}%` } }
      : {};
  
    const countryData = await attestationCategory.findAll({
      attributes: [
        'countryCode', 
        'country',   
      ],
      where: whereClause, 
      group: ['countryCode', 'country'], 
      order: [['country', 'ASC']],  
    });
  
    // Format the result to match the required output structure
    return countryData.map((country) => ({
      value: country.countryCode,
      label: country.country,
    }));
  };