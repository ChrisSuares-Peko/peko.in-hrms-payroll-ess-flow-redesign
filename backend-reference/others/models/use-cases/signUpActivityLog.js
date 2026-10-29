const { Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const sequelizeConfig = require("../../configs/database/index");
const { formattedDateTime } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const signUpActivityLog = require('./../entities/signUpActivityLog')

const { handleSortFields } = require("../../utils/sortHandle");

exports.findAllPendingSignUps = asyncHandler(async (params) => {
    try {
      let {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        from,
        to,
        partnerId,
        status
      } = params;

      searchText = searchText || "";
      status = status || "PENDING";

      const orderClause = handleSortFields(sortField, sort);

      // One WHERE for both queries so the total can never disagree with the
      // rows — the count must reflect status + search + date + partner, not
      // just status (that mismatch is what made recordsTotal wrong).
      const whereClause = `
        WHERE
          sal.status = :status AND
          (
            sal.id LIKE :searchText OR
            sal.contactPersonName LIKE :searchText OR
            sal.email LIKE :searchText OR
            sal.mobileNo LIKE :searchText OR
            sal.companyName LIKE :searchText OR
            sal.referralCode LIKE :searchText OR
            c.name LIKE :searchText
          )
          ${from && to ? `AND sal.createdAt BETWEEN :from AND :to` : ''}
          ${partnerId ? (partnerId === 'default'
            ? `AND sal.partnerId IS NULL`
            : `AND sal.partnerId = :partnerId`) : ''}
      `;

      const dataQuery = `
        SELECT
          sal.*,
          c.name AS partnerName
        FROM signUpActivityLogs sal
        LEFT JOIN credentials c ON sal.partnerId = c.id
        ${whereClause}
        ORDER BY ${orderClause.map(([f, d]) => `${f} ${d}`).join(", ")}
        LIMIT :limit
        OFFSET :offset;
      `;

      const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM signUpActivityLogs sal
        LEFT JOIN credentials c ON sal.partnerId = c.id
        ${whereClause};
      `;

      const replacements = {
        searchText: `%${searchText}%`,
        status,
        limit,
        offset
      };

      if (from && to) {
        const tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        replacements.from = from;
        replacements.to = tomorrow;
      }

      if (partnerId && partnerId !== "default") {
        replacements.partnerId = partnerId;
      }

      const [data, countResult] = await Promise.all([
        sequelizeConfig.query(dataQuery, {
          replacements,
          type: Sequelize.QueryTypes.SELECT,
        }),
        sequelizeConfig.query(countQuery, {
          replacements,
          type: Sequelize.QueryTypes.SELECT,
        }),
      ]);

      const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

      return { rows: data, count: totalCount };
  
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

  exports.pendingSignUpsExport = asyncHandler(async (params) => {
    try {
        let {
            searchText,
            sort,
            sortField,
            from,
            to,
            partnerId,
            status
        } = params;

        searchText = searchText || "";
        status = status || "PENDING";

        const orderClause = handleSortFields(sortField, sort);

        const query = `
        SELECT
          signUpActivityLogs.*,
          credentials.name AS partnerName
        FROM signUpActivityLogs
        LEFT JOIN credentials
          ON signUpActivityLogs.partnerId = credentials.id
        WHERE
          signUpActivityLogs.status = :status AND
          (
            signUpActivityLogs.id LIKE :searchText OR 
            signUpActivityLogs.contactPersonName LIKE :searchText OR
            signUpActivityLogs.email LIKE :searchText OR
            signUpActivityLogs.mobileNo LIKE :searchText OR
            signUpActivityLogs.companyName LIKE :searchText OR
            signUpActivityLogs.referralCode LIKE :searchText OR
            credentials.name LIKE :searchText
          )
          ${from && to ? `AND signUpActivityLogs.createdAt BETWEEN :from AND :to` : ''}
          ${partnerId ? (partnerId ===  "default"
                ? `AND signUpActivityLogs.partnerId IS NULL`
                :  `AND signUpActivityLogs.partnerId = :partnerId`) : ''}
        ORDER BY ${orderClause.map(([f, d]) => `${f} ${d}`).join(", ")};
      `;

        const replacements = {
            searchText: `%${searchText}%`,
            status,
        };

        if (from && to) {
            const tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            replacements.from = from;
            replacements.to = tomorrow;
        }

        if (partnerId && partnerId !== "default") {
            replacements.partnerId = partnerId;
        }

        const data = await sequelizeConfig.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });

        return data.map(limitData => ({
            Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
            "Company Name": limitData.companyName || "Not Available",
            "Email ID": limitData.email || "Not Available",
            "Mobile Number": limitData.mobileNo || "Not Available",
            "Partner ID": limitData.partnerId || "Not Available",
            "Partner Name": limitData.partnerName || "Not Available",
            "Password Created": limitData.isPasswordCreated === 1 ? "Yes" : "No",
            "Email OTP Validated": limitData.isEmailOTPValidated === 1 ? "Yes" : "No",
            "Mobile OTP Validated": limitData.isMobileOTPValidated === 1 ? "Yes" : "No",
            Status: limitData.status || "Not Available",
        }));

    }
    catch (error) {
        customLog(
            null,
            "error",
            {
                error: error,
            },

        );
        throw { message: "Something went wrong" };
    }
});

exports.findById = asyncHandler(async (id) => {
    return await signUpActivityLog.findOne({
        where: {
            id,
            status: 'PENDING'
        }
    })
})

exports.update = asyncHandler(async (params, data) => {
    try {
        return await signUpActivityLog.update(data, {
            where: {
                id: params.id
            },
        });
    } catch (error) {
        customLog(
            null,
            "error",
            {
                error: error,
            },
        );
        throw error;
    }
});