const {
    validatePasswordPolicy,
    validatePassword,
    countCharacterDifferences,
} = require("../../utils/passwordPolicy");
const credential = require("./../entities/credential");
const { Op } = require("sequelize");

const findOneCredential = async (params, attributes = undefined) => {
    try {
        return await credential.findOne({
            where: {
                id: params.id,
            },
            attributes,
        });
    } catch (error) {
        console.log(error);
    } finally {
        console.log("CREDENTIAL FIND ONE ROUTE CALLED");
    }
};

const findByAnyField = async (query) => {
    return await credential.findOne({
        where: query,
    });
};

const changePassword = async (details, id) => {
    const userDetails = details;
    try {
        const userData = await credential.findOne({
            where: {
                id,
            },
            attributes: ["password", "passwordHistory", "passwordProtection"],
        });
        if (!userData || userData.length < 1)
            return {
                status: false,
                statusCode: 404,
                responseCode: "900",
                responseMessage: "Sorry, the user doesn't exist",
            };
        if (userData.validatePassword(userDetails.oldPassword)) {
            try {
                if (userData.passwordProtection) {
                    await validatePasswordPolicy(userDetails.newPassword);
                    await validatePassword(userDetails.newPassword, userData);
                }
            } catch (error) {
                console.log("🚀 ~ error:", error);
                return {
                    status: false,
                    statusCode: 400,
                    responseCode: "001",
                    responseMessage: error.message,
                };
            }
            if (
                !(await countCharacterDifferences(
                    userDetails.oldPassword,
                    userDetails.newPassword
                ))
            ) {
                return {
                    status: false,
                    statusCode: 400,
                    responseCode: "001",
                    responseMessage:
                        "Your current and previous passwords seem similar.Characters need to be changed",
                };
            }
            var newPassword = credential.hashPassword(userDetails.newPassword);
            const updatedData = await credential.update(
                {
                    password: newPassword,
                    passwordHistory: {
                        currentPassword: newPassword,
                        previousPasswords: [
                            ...userData.passwordHistory.previousPasswords,
                            userData.password,
                        ],
                    },
                    passwordDate: Date.now(),
                },
                {
                    where: {
                        id,
                    },
                }
            );
            if (!updatedData || updatedData.length < 1)
                return {
                    status: false,
                    statusCode: 500,
                    responseCode: "999",
                    responseMessage:
                        "An error occured while updating the password",
                };
            return {
                status: true,
                statusCode: 200,
                responseCode: "000",
                responseMessage: "Password changed successfully",
            };
        } else {
            return {
                status: false,
                statusCode: 401,
                responseCode: "902",
                responseMessage: "Current password is incorrect",
            };
        }
    } catch (err) {
        console.log(err);
        return {
            status: false,
            statusCode: 500,
            responseCode: "999",
            responseMessage: "Internal server error",
        };
    }
};

const fetchAllPartner = async (query) => {
    try {
        return await credential.findAll({
            where: {
                [Op.or]: [
                    {
                        username: {
                            [Op.like]: "%" + query + "%",
                        },
                    },
                    {
                        name: {
                            [Op.like]: "%" + query + "%",
                        },
                    },
                ],
                role: "PARTNER",
            },
            attributes: ["id", "username", "name"],
        });
    } catch (error) {
        console.log(error);
        console.log(error.message.message);
    } finally {
        console.log("FETCH CORPORATE ROUTE CALLED");
    }
};

const findCorporateByPartner = async (registeredBy) => {
    return await credential.findAll({
        where: {
            registeredBy: registeredBy,
        },
    });
};

const fetchAllSubPartnerList = async (partnerId) => {
    try {
        return await credential.findAll({
            where: {
                role: "SYSTEM_USER",
                subPartnerId: {
                    [Op.ne]: null,
                },
                registeredBy: partnerId,
            },
            attributes: ["id", "username", "name"],
        });
    } catch (error) {
        console.log(error);
        console.log(error.message.message);
    } finally {
        console.log("FETCH SUB PARTNERS ROUTE CALLED");
    }
};
const findAllCredentialAccounts = async (attributes = undefined) => {
    try {
        return await credential.findAll({
            attributes,
        });
    } catch (error) {
        console.log(error);
    } finally {
        console.log("FIND ALL CREDENTIAL ACCOUNTS ROUTE CALLED");
    }
};

const findAllInternalCredentialAccounts = async (
    params,
    attributes = undefined
) => {
    try {
        const {
            limit,
            offset,
            searchText,
            sort,
            sortField,
            internalAccountIds,
        } = params;

        // If provided but empty → return empty result
        if (
            Array.isArray(internalAccountIds) &&
            internalAccountIds.length === 0
        ) {
            return { rows: [], count: 0 };
        }

        const where = {
            id: { [Op.in]: internalAccountIds },
        };

        // Search by username / name / email
        if (searchText) {
            where[Op.or] = [
                { username: { [Op.like]: `%${searchText}%` } },
                { name: { [Op.like]: `%${searchText}%` } },
                { email: { [Op.like]: `%${searchText}%` } },
            ];
        }

        return await credential.findAndCountAll({
            where,
            attributes,
            limit,
            offset,
            order: [[sortField, sort]],
        });
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        console.log("FIND ALL INTERNAL CREDENTIAL ACCOUNTS ROUTE CALLED");
    }
};

module.exports = {
    findOneCredential,
    changePassword,
    fetchAllPartner,
    findByAnyField,
    findCorporateByPartner,
    fetchAllSubPartnerList,
    findAllCredentialAccounts,
    findAllInternalCredentialAccounts,
};
