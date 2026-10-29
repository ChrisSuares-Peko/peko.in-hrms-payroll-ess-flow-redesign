const {
    findAllPasswordPolicies,
  } = require("../models/use-cases/passwordPolicy");

exports.validatePasswordPolicy = async (password) => {
    try {
    let policies = await findAllPasswordPolicies();
      const defaultPasswordPolicy = [{
        id: 0,
        level: 1,
        minLength: 8,
        minPasswordAge: 0,
        maxPasswordAge: 100000000,
        minChangeChars: 3,
        prohibitPasswordReuse: true,
        prohibitPasswordReuseTimes: 2,
        maxInvalidLoginAttempts: 3,
        lockEffectivePeriod: 2,
        lockoutTimespan: 4,
        enableBannedPasswords: true,
        customBannedPasswords: 'REDACTED',
        preventPersonalDataInPassword: true,
        createdAt: new Date(), 
        updatedAt: new Date() 
    }];
  
    if (!policies || policies.length === 0) {
        policies=defaultPasswordPolicy
    }
  
  
      const policy = policies[0];
  
      if (policy.level >= 1 && password.length === 0) {
        throw new Error("Password cannot be empty.");
      }
      if (policy.level >= 2 && password.length < policy.minLength) {
        throw new Error(
          `Password must be at least ${policy.minLength} characters long.`
        );
      }
      if (policy.level >= 3) {
        if (
          !/[a-z]/.test(password) ||
          !/[A-Z]/.test(password) ||
          !/[0-9]/.test(password)
        ) {
          throw new Error(
            "Password must contain at least one lowercase letter,one uppercase letter and one number."
          );
        }
      }
      if (policy.level >= 4 && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Error("Password must contain at least one special character.");
      }
      if (policy.level >= 5 && /(.)\1{2,}/.test(password)) {
        throw new Error(
          "Password cannot contain more than 2 consecutive repeated characters in a row."
        );
      }
  
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  exports.validatePassword = async (password, userData) => {
    try {
      let policies = await findAllPasswordPolicies();
      const defaultPasswordPolicy =[ {
        id: 0,
        level: 1,
        minLength: 8,
        minPasswordAge: 0,
        maxPasswordAge: 100000000,
        minChangeChars: 3,
        prohibitPasswordReuse: true,
        prohibitPasswordReuseTimes: 2,
        maxInvalidLoginAttempts: 3,
        lockEffectivePeriod: 2,
        lockoutTimespan: 4,
        enableBannedPasswords: true,
        customBannedPasswords: 'REDACTED',
        preventPersonalDataInPassword: true,
        createdAt: new Date(), 
        updatedAt: new Date() 
    }];
  
    if (!policies || policies.length === 0) {
        policies=defaultPasswordPolicy
    }
  
      console.log(
        "🚀 ~ router.post ~ policies:",
        policies[0].customBannedPasswords
      );
      if (policies.length > 0) {
        const bannedPasswords = policies[0].customBannedPasswords.split(",");
        if (
          bannedPasswords.find(
            (item) => item === password && policies[0].enableBannedPasswords
          )
        ) {
          throw new Error("The password you entered is restricted.");
        }
        console.log(
          "🚀 ~ exports.validatePassword= ~ policies[0].prohibitPasswordReuseTimes:",
          policies[0].prohibitPasswordReuseTimes
        );
        if (
          userData.validatePasswords(
            password,
            policies[0].prohibitPasswordReuseTimes
          )
        ) {
          throw new Error(
            `Your new password cannot be the same as any of your last passwords. Please choose a different password.`
          );
        }
        //   if (policies[0].preventPersonalDataInPassword) {
        
        //     const valuesArray = Object.values(corporateData).map((value) =>
        //       value.toString().toLowerCase()
        //     );
  
        //     if (
        //       valuesArray.some((value) => password.toLowerCase().includes(value))
        //     ) {
        //       throw new Error(
        //         "The password you entered matches your personal information"
        //       );
        //     }
        //   }
      } else {
        if (userData.validatePasswords(password, null)) {
          throw new Error(
            "The new password you entered matches the current password."
          );
        }
      }
  
      return true;
    } catch (error) {
      console.log("🚀 ~ exports.validatePassword= ~ error:", error);
      throw new Error(error.message);
    }
  };

  exports.countCharacterDifferences = async (password, newPassword) => {
    let policies = await findAllPasswordPolicies();
    const defaultPasswordPolicy = [{
      id: 0,
      level: 1,
      minLength: 8,
      minPasswordAge: 0,
      maxPasswordAge: 100000000,
      minChangeChars: 0,
      prohibitPasswordReuse: true,
      prohibitPasswordReuseTimes: 2,
      maxInvalidLoginAttempts: 3,
      lockEffectivePeriod: 2,
      lockoutTimespan: 4,
      enableBannedPasswords: true,
      customBannedPasswords: 'REDACTED',
      preventPersonalDataInPassword: true,
      createdAt: new Date(), 
      updatedAt: new Date() 
  }];
  
  if (!policies || policies.length === 0) {
     policies=defaultPasswordPolicy
  }
  
    if (policies) {
      const maxLength = Math.max(password.length, newPassword.length);
      const paddedPassword = password.padEnd(maxLength, " ");
      const paddedNewPassword = newPassword.padEnd(maxLength, " ");
  
      let differenceCount = 0;
      for (let i = 0; i < maxLength; i++) {
        if (paddedPassword[i] !== paddedNewPassword[i]) {
          differenceCount++;
        }
      }
      if (differenceCount > (policies[0]?.minChangeChars)) {
        return true;
      } else return false;
    } else {
      return true;
    }
  };