

const passwordPolicy = require("./../entities/passwordPolicy");

exports.createPasswordPolicy = async (policyData) => {
  try {
    if (!policyData) {
      throw new Error("Invalid policy data");
    }

    const {
      level,
      minLength,
      minPasswordAge,
      maxPasswordAge,
      minChangeChars,
      prohibitPasswordReuse,
      prohibitPasswordReuseTimes,
    } = policyData;

    const existingPolicy = await passwordPolicy.findOne();
    if (existingPolicy) {
      throw new Error("Password policy already exists");
    }

    const newPolicy = await passwordPolicy.create({
      level,
      minLength,
      minPasswordAge,
      maxPasswordAge,
      minChangeChars,
      prohibitPasswordReuse,
      prohibitPasswordReuseTimes,
    });

    return {
      status: true,
      message: "Password policy created successfully",
      data: newPolicy,
    };
  } catch (error) {
    // Handle errors
    return {
      status: false,
      message: error.message,
      data: {},
    };
  }
};

exports.updatePasswordPolicy = async (policyId, updateData) => {
  return await passwordPolicy.update(updateData, {
    where: { id: policyId },
  });
};

exports.findAllPasswordPolicies = async () => {
  return await passwordPolicy.findAll();
};

exports.deletePasswordPolicy = async (policyId) => {
  return await passwordPolicy.destroy({
    where: { id: policyId },
  });
};
