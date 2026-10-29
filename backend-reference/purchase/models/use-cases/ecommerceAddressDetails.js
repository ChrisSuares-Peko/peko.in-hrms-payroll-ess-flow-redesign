const asyncHandler = require("./../../middlewares/async");
const ecommerceAddressDetails = require("./../entities/ecommerceAddressDetails");

exports.createEcommerceAddress = asyncHandler(async (data) => {
    if (data.default === true) {
        await ecommerceAddressDetails.update(
            { default: false },
            {
                where: {
                    credentialId: data.credentialId,
                },
            }
        );
    }
    return await ecommerceAddressDetails.create(data);
});

exports.findEcommerceAddressByFields = asyncHandler(async ({ credentialId, addressLine1, zipCode }) => {
    return await ecommerceAddressDetails.findOne({
        where: {
            credentialId,
            addressLine1,
            ...(zipCode ? { zipCode } : {}),
        },
    });
});

exports.findAllEcommerceAddresses = asyncHandler(async ({ credentialId }) => {
    return await ecommerceAddressDetails.findAll({
        where: {
            credentialId,
        },
        raw: true,
        nest: true,
    });
});
