//this is used ot creaet opt and veirfy
//it receive either mobile number or email address and otp
// it save it in OT2 entity and verify

const asyncHandler = require("../../middlewares/async");
const crypto = require("crypto");
const OTP = require("../entities/commonOTP");

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
    const otpRecord = await OTP.findOne({
      where: {
        contact: contact,
      },
    });

    if (!otpRecord) {
      return {
        isVerified: false,
        message: 'Sorry, the OTP has expired. Please request a new OTP.'
      };
    }
    
    const isOtpValid = await otpRecord.validateOtp(otp);

    if (!isOtpValid) {
      return {
        isVerified: false,
        message: `Incorrect OTP, Please enter correct OTP.`
      };
    }
    
    return {
      isVerified: true,
      message: "verified",
    };
  } catch (error) {
    console.error("Error while verifying OTP:", error);
    console.log(error.message);
    return {
      isVerified: false,
      message: error.message,
    };
  }
};
