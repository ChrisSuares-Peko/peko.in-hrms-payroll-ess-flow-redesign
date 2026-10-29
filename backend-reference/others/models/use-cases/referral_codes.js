
const referral_codes = require('../entities/referral_codes')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async');
const { formattedDateTime } = require('../../utils/formatter');
let sequelizeConfig = require('../../configs/database/index');
const corporateUser = require('../entities/corporateUser');
const setting = require('../entities/setting');
const { Sequelize } = require('sequelize');

exports.create = asyncHandler(async (params) => {
    const codeData = await referral_codes.create(params)
    if (!codeData) {
        return false;
    }
    return codeData
})

exports.findOne = asyncHandler(async (params) => {
    return await referral_codes.findOne({
        where: {
            id: params
        },
        raw: true,
        nest: true,
    })

})

exports.findOneWithReferalcode = asyncHandler(async (params, partnerId) => {
    return await referral_codes.findOne({
        where: {
            referralCode: params,
            partnerId: partnerId
        },
        raw: true,
        nest: true,
    })

})
exports.findAllWithReferalcodePartnerID = asyncHandler(
  async (params, partnerId) => {
    try {
      const { searchText } = params;

      let query = `
        SELECT 
            *
        FROM 
            referral_codes
        WHERE 
           referral_codes.referralCode LIKE CONCAT('%', :searchText, '%')
           AND referral_codes.status = true
      `;

      // add partnerId filter ONLY when valid
      if (partnerId !== null && partnerId !== "" && partnerId !== undefined) {
        query += ` AND partnerId = :partnerId `;
      }else {
        query += ` AND partnerId IS NULL `;
      }

      const replacements = {
        searchText: searchText || '',
      };

      if (partnerId !== null && partnerId !== "" && partnerId !== undefined) {
        replacements.partnerId = partnerId;
      }

      const result = await sequelizeConfig.query(query, {
        replacements,
        type: sequelizeConfig.QueryTypes.SELECT,
      });
      // Structure the output
        return {
            rows: result,
        };
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  }
);



exports.findAllReferralCodes = asyncHandler(async () => {
    return await referral_codes.findAll({
        where: {
            status: true
        }
    })

})

exports.updateReferralCode = asyncHandler(async (params, data) => {
    return await referral_codes.update(data, {
        where: {
            id: params.id
        }
    })
})

exports.deleteReferralCode = asyncHandler(async (params) => {
    return await referral_codes.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findAllReferralCodesAndCount = asyncHandler(async (params) => {
    try {
        const allowedSortFields = [
            "createdAt",
            "referralCode",
            "contactPersonName",
            "contactPersonPhone",
            "partnerId",
            "status",
        ];

        const sortField = allowedSortFields.includes(params.sortField)
            ? params.sortField
            : "createdAt";

        const sort = params.sort === "ASC" ? "ASC" : "DESC";

        const dataQuery = `
        SELECT 
          referral_codes.*,
          credentials.name AS partnerName
        FROM referral_codes
        LEFT JOIN credentials 
          ON referral_codes.partnerId = credentials.id
        WHERE 
          referral_codes.id LIKE CONCAT('%', :searchText, '%')
          OR referral_codes.referralCode LIKE CONCAT('%', :searchText, '%')
          OR referral_codes.contactPersonName LIKE CONCAT('%', :searchText, '%')
          OR referral_codes.contactPersonPhone LIKE CONCAT('%', :searchText, '%')
          OR credentials.name LIKE CONCAT('%', :searchText, '%')
        ORDER BY ${sortField} ${sort}
        LIMIT :limit OFFSET :offset;
      `;

        const totalCountQuery = `
        SELECT COUNT(*) AS totalCount
        FROM referral_codes
        WHERE 
          id LIKE CONCAT('%', :searchText, '%')
          OR referralCode LIKE CONCAT('%', :searchText, '%');
      `;

        const [result, totalCountResult] = await Promise.all([
            sequelizeConfig.query(dataQuery, {
                replacements: {
                    searchText: params.searchText || "",
                    limit: params.limit || 10,
                    offset: params.offset || 0,
                },
                type: sequelizeConfig.QueryTypes.SELECT,
            }),
            sequelizeConfig.query(totalCountQuery, {
                replacements: {
                    searchText: params.searchText || "",
                },
                type: sequelizeConfig.QueryTypes.SELECT,
            }),
        ]);

        return {
            rows: result,
            count: totalCountResult[0].totalCount,
        };
    } catch (error) {
        console.log(error);
        return false;
    }
});

exports.referralCodesAndCountExport = asyncHandler(async (params) => {
    try {
        const allowedSortFields = [
            "createdAt",
            "referralCode",
            "contactPersonName",
            "contactPersonPhone",
            "partnerId",
            "status",
        ];

        const sortField = allowedSortFields.includes(params.sortField)
            ? params.sortField
            : "createdAt";

        const sort = params.sort === "ASC" ? "ASC" : "DESC";

        const data = await sequelizeConfig.query(
            `
        SELECT 
          referral_codes.*,
          credentials.name AS partnerName
        FROM referral_codes
        LEFT JOIN credentials 
          ON referral_codes.partnerId = credentials.id
        WHERE 
          referral_codes.id LIKE CONCAT('%', :searchText, '%')
          OR referral_codes.referralCode LIKE CONCAT('%', :searchText, '%')
          OR referral_codes.contactPersonName LIKE CONCAT('%', :searchText, '%')
          OR referral_codes.contactPersonPhone LIKE CONCAT('%', :searchText, '%')
          OR credentials.name LIKE CONCAT('%', :searchText, '%')
        ORDER BY ${sortField} ${sort};
        `,
            {
                replacements: {
                    searchText: params.searchText || "",
                },
                type: sequelizeConfig.QueryTypes.SELECT,
            }
        );

        const finalData = data.map(limitData => ({
            Date: limitData.createdAt
                ? formattedDateTime(limitData.createdAt)
                : "Not Available",
            "Referral Code": limitData.referralCode || "Not Available",
            "Contact Person Name": limitData.contactPersonName || "Not Available",
            "Contact Person Mobile": limitData.contactPersonPhone || "Not Available",
            "Partner Name": limitData.partnerName || "Not Available",
            Status: limitData.status > 0 ? "Active" : "In Active",
        }));

        return finalData;
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
});
exports.getExcelCSVData = asyncHandler(async () => {

    let data = await referral_codes.findAll({
        attributes: ['id', 'referralCode', 'contactPersonName', 'contactPersonPhone'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true

    })

    let finalData = []
    data.forEach(function (codeData) {
        finalData.push({
            'ID': codeData.id,
            'Referral Code': codeData.referralCode ? codeData.referralCode : 'Not Available',
            'Contact Person Name': codeData.contactPersonName ? codeData.contactPersonName : 'Not Available',
            'Contact Person Number': codeData.contactPersonPhone ? codeData.contactPersonPhone : 'Not Available'
        })
    })
    return finalData
})

exports.findReferralReportCount = asyncHandler(async (params) => {
    try {
        let {
            fromDate,
            toDate,
            partnerId,
            referralCode
        } = params
        let whereClause={referralCode:{[Op.ne]:null}};
        if (partnerId){
            if (partnerId==='default'){
                whereClause.registeredBy = null
            } 
            else{
                whereClause.registeredBy = partnerId
            }           
        }
        if (referralCode){
            whereClause.referralCode = referralCode
        }
        const tomorrow = new Date(toDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if(fromDate && toDate)
        {
            whereClause.createdAt = {
                        [Op.between]: [fromDate, tomorrow]
            };
        }
        
        let data = await corporateUser.count({
            where: whereClause,
            raw: true
        })
        return data;
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }

})
exports.findReferralReportExcel = asyncHandler(async (params) => {
    try {
        let {
            fromDate,
            toDate,
            partnerId,
            referralCode
        } = params
        let whereClause={referralCode:{[Op.ne]:null}};
        if (partnerId){
            if (partnerId==='default'){
                whereClause.registeredBy = null
            } 
            else{
                whereClause.registeredBy = partnerId
            }           
        }
        if (referralCode){
            whereClause.referralCode = referralCode
        }
        const tomorrow = new Date(toDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if(fromDate && toDate)
        {
            whereClause.createdAt = {
                        [Op.between]: [fromDate, tomorrow]
            };
        }
        
        let data = await corporateUser.findAll({
            where: whereClause,
            attributes: ['email','name','contactPersonName', 'referralCode', 'mobileNo','createdAt'],
            raw: true
    
        })
        let finalData = [];
        data.forEach(function (limitData) {
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
                "Referral Code": limitData.referralCode ? limitData.referralCode : "Not Available",
                "Name": limitData.contactPersonName ? limitData.contactPersonName : "Not Available",
                "Mobile": limitData.mobileNo ? limitData.mobileNo : "Not Available",
                "Email": limitData.email || "Not Available",
            });
        });
        return finalData;
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
})
exports.findGeneralReferralReportExcel = asyncHandler(async (params) => {
    try {
        let {
            fromDate,
            toDate,
            partnerId
        } = params
        let query =`
            SELECT 
                    corporateUser.referralCode,
                    COUNT(*) AS count,
                    referralCode.contactPersonName AS contactPersonName
                FROM
                    corporateUsers AS corporateUser
                        LEFT JOIN
                    referral_codes AS referralCode ON referralCode.referralCode = corporateUser.referralCode
                     WHERE corporateUser.referralCode IS NOT NULL `
        if (partnerId){
            if (partnerId==='default')
            {
                query+=` AND corporateUser.registeredBy is NULL`
            }   
            else{
                query+=` AND corporateUser.registeredBy = ${partnerId}`   
            } 
        } 
        
        if (fromDate && toDate) {
            query+=` AND corporateUser.createdAt between  '${fromDate} 00:00:00' AND '${toDate} 23:59:59' `
        }
        query+=` GROUP BY referralCode , referralCode.contactPersonName`

        const data = await sequelizeConfig.query(query, {
                     type: sequelizeConfig.QueryTypes.SELECT,
        })
        let finalData = [];
        data.forEach(function (limitData) {
            finalData.push({
                "Referral Code": limitData.referralCode ? limitData.referralCode : "Not Available",
                "Referral Used By (users)": limitData.count ? limitData.count : 0,
                "Contact Person Name": limitData.contactPersonName || "Not Available",
            });
        });
        return finalData;
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
})

exports.fetchReferralReward = async () => {
    const data = await setting.findOne({
        where: {
            name: "referralReward",
        },
    });
    return data?.details;
};

exports.updateReferralReward = async (newReward) => {
    const data = await setting.update({
        details: Sequelize.literal(`JSON_SET(details, '$.reward', ${newReward})`)
    },
        {
            where: {
                name: "referralReward",
            },
        }
    );
    return data?.details;
};