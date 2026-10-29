//this is used ot creaet opt and veirfy 
//it receive either mobile number or email address and otp 
// it save it in OT2 entity and verify 

const asyncHandler = require("../../middlewares/async");
const OTP = require("../entities/commonOTP");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sequelize = require("../../configs/database/index");

exports.createOtp = asyncHandler(async ({
    contact, expiresInMinutes = 2
}) => {
    try {
        if (!contact) {
            throw new Error('A valid contact is required for creating OTP');
        }
        let otp = String(crypto.randomInt(100000, 1000000));
        let otpHash = OTP.hashOtp(otp);
        const existingOtp = await OTP.findOne({
            where: {
                contact: contact,
            },
        });
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

        if (existingOtp) {
            existingOtp.otp = otpHash;
            existingOtp.expiresAt = expiresAt;
            existingOtp.used = false;
            existingOtp.attempts = 0;
            await existingOtp.save();
        } else {
            await OTP.create({
                contact: contact,
                otp: otpHash,
                expiresAt: expiresAt,
            });
        }
        return otp;
    } catch (error) {
        console.error("Error while creating/updating OTP:", error);
        return false;
    }
});

exports.verifyOtp = async ({ contact, otp }) => {
    try {
        return await sequelize.transaction(async (t) => {
            const otpRecord = await OTP.findOne({
                where: {
                    contact: contact,
                },
                lock: t.LOCK.UPDATE,
                transaction: t,
            });

            if (!otpRecord) {
                return {
                    isVerified: false,
                    message: 'OTP is not found!'
                };
            }
            if (otpRecord.expiresAt < new Date()) {
                return {
                    isVerified: false,
                    message: 'OTP has expired. Please request a new one.',
                };
            }
            if (otpRecord.used) {
                return {
                    isVerified: false,
                    message: 'OTP has already been used.',
                };
            }

            const MAX_OTP_ATTEMPTS = 5;
            if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
                return {
                    isVerified: false,
                    message: 'Too many incorrect attempts. Please request a new OTP.',
                };
            }

            const isOtpValid = bcrypt.compareSync(otp, otpRecord.otp);

            if (!isOtpValid) {
                otpRecord.attempts += 1;
                await otpRecord.save({ transaction: t });
                return {
                    isVerified: false,
                    message: 'Incorrect OTP. Please enter the correct OTP.',
                };
            }

            otpRecord.used = true;
            await otpRecord.save({ transaction: t });

            return {
                isVerified: true,
                message: 'verified'
            };
        });
    } catch (error) {
        console.error("Error while verifying OTP:", error);
        console.log(error.message);
        return {
            isVerified: false,
            message: error.message
        };
    }
};