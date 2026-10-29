const {
    findAllPasswordPolicies,
  } = require("../models/use-cases/passwordPolicy");
  const { customLog } = require('./loggerHelper');
  
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
      if (policy.level >= 5 && /(.)\1{1,}/.test(password) ) {
       
        throw new Error(
          "Password cannot contain more than 2 consecutive repeated characters in a row."
        );
      }
  
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  exports.checkBannedPassword=async(password)=>{
    const policies = await findAllPasswordPolicies();
    if (policies.length > 0) {
      const bannedPasswords = policies[0].customBannedPasswords.split(",");
      if (
        bannedPasswords.find(
          (item) => item === password && policies[0].enableBannedPasswords
        )
      ) {
        throw new Error("The password you entered is restricted.");
      }
    }
    return true
  }
  
  
  exports.validatePassword = async (password, userData) => {
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
  
      customLog(null, 'info', { message: 'Checking password policy', customBannedPasswords: policies[0].customBannedPasswords }, 'CONSOLE');
      if (policies.length > 0) {
        const bannedPasswords = policies[0].customBannedPasswords.split(",");
        if (
          bannedPasswords.find(
            (item) => item === password && policies[0].enableBannedPasswords
          )
        ) {
          throw new Error("The password you entered is restricted.");
        }
        customLog(null, 'info', { message: 'Checking prohibitPasswordReuseTimes', prohibitPasswordReuseTimes: policies[0].prohibitPasswordReuseTimes }, 'CONSOLE');
        if (
          userData.validatePasswords(
            password,
            policies[0].prohibitPasswordReuseTimes
          )
        ) {
          throw new Error(
            "The password you entered matches the previous password."
          );
        }
        //   if (policies[0].preventPersonalDataInPassword) {
        //     console.log('hiii');
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
            "The password you entered matches the previous password."
          );
        }
      }
  
      return true;
    } catch (error) {
      customLog(null, 'error', { message: 'Error in validatePassword', error: error.message }, 'CONSOLE');
      throw new Error(error.message);
    }
  };
  exports.validateBannedPasswordForNewUser = async (password) => {
    try {
      let policies = await findAllPasswordPolicies();
      const defaultPasswordPolicy = {
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
    };
  
    if (!policies || policies.length === 0) {
       policies=defaultPasswordPolicy
    }
  
  
      if (policies.length > 0) {
        const bannedPasswords = policies[0].customBannedPasswords.split(",");
        if (
          bannedPasswords.find(
            (item) => item === password && policies[0].enableBannedPasswords
          )
        ) {
          throw new Error("The password you entered is restricted.");
        }
      } 
      return true;
    } catch (error) {
      customLog(null, 'error', { message: 'Error in validateBannedPasswordForNewUser', error: error.message }, 'CONSOLE');
      throw new Error(error.message);
    }
  };
  const checkLockoutPeriod = (dbTimeString, lockoutMinutes) => {
    const dbDate = new Date(dbTimeString);
    const currentTime = new Date();
  
    // Calculate the difference in minutes
    const timeDifferenceInMinutes = (currentTime - dbDate) / (1000 * 60);
  
    if (timeDifferenceInMinutes < lockoutMinutes) {
      return "LESSER";
    } else if (timeDifferenceInMinutes === lockoutMinutes) {
      return "EQUAL";
    } else {
      return "GREATER";
    }
  };
  
  exports.checkDate = async (dbDateString) => {
    const policies = await findAllPasswordPolicies();
    const daysToAdd = policies[0].maxPasswordAge;
    const dbDate = new Date(dbDateString);
    const currentDate = new Date();
  
    const futureDate = new Date(dbDate);
    futureDate.setDate(futureDate.getDate() + daysToAdd);
  
    // Normalize both dates to the same format (YYYY-MM-DD) for comparison
    const normalizeDate = (date) => {
      return date.toISOString().split("T")[0];
    };
  
    const normalizedFutureDate = normalizeDate(futureDate);
    customLog(null, 'info', { message: 'Checking date expiry', normalizedFutureDate }, 'CONSOLE');
    const normalizedCurrentDate = normalizeDate(currentDate);
    customLog(null, 'info', { message: 'Checking date expiry', normalizedCurrentDate }, 'CONSOLE');
    return normalizedFutureDate <= normalizedCurrentDate;
  };
  
  exports.passwordProtections = async (userData) => {
    try {
      const policies = await findAllPasswordPolicies();
      if (policies.length > 0 &&userData.passwordProtection) {
        if (userData.lockPeriod) {
          const check = checkLockoutPeriod(
            userData.lockPeriod,
            policies[0].lockEffectivePeriod
          );
          customLog(null, 'info', { message: 'Password protection lockout check result', check }, 'CONSOLE');
          if (check === "GREATER" || check === "EQUAL") {
            await userData.update({
              loginAttempts: 1,
              firstLoginAttempt: Date.now(),
              lockPeriod: null,
            });
            throw new Error(
              `Incorrect Password – You have ${
                policies[0].maxInvalidLoginAttempts - 1
              } attempts left`
            );
          } else if (check === "LESSER") {
            throw new Error(
              `Account Locked: Exceeded login attempts.Please try again after some time.`
            );
          }
        } else if (
          userData.loginAttempts + 1 ===
          policies[0].maxInvalidLoginAttempts
        ) {
          await userData.update({
            loginAttempts: userData.loginAttempts + 1,
            lockPeriod: Date.now(),
          });
          throw new Error(
            `Account Locked: Exceeded login attempts.Please try again after some time.`
          );
        } else if (userData.firstLoginAttempt) {
          const checkLockOutTimeSpan = checkLockoutPeriod(
            userData.firstLoginAttempt,
            policies[0].lockoutTimespan
          );
  
          if (
            checkLockOutTimeSpan === "GREATER" ||
            checkLockOutTimeSpan === "EQUAL"
          ) {
            await userData.update({
              loginAttempts: 1,
              firstLoginAttempt: Date.now(),
              lockPeriod: null,
            });
            throw new Error(
              `Incorrect Password – You have ${
                policies[0].maxInvalidLoginAttempts - 1
              } attempts left`
            );
          }
          await userData.update({
            loginAttempts: userData.loginAttempts + 1,
          });
          throw new Error(
            `Incorrect Password – You have ${
              policies[0].maxInvalidLoginAttempts - userData.loginAttempts
            } attempts left`
          );
        } else if (!userData.firstLoginAttempt) {
          await userData.update({
            loginAttempts: userData.loginAttempts + 1,
            firstLoginAttempt: Date.now(),
          });
          throw new Error(
            `Incorrect Password – You have ${
              policies[0].maxInvalidLoginAttempts - 1
            } attempts left`
          );
        }
        throw new Error("Incorrect Password");
      } else {
        throw new Error("Incorrect Password");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  exports.CheckLockPeriod = async (userData) => {
    try {
      const policies = await findAllPasswordPolicies();
      if (userData.lockPeriod) {
        if (policies.length > 0) {
          const check = checkLockoutPeriod(
            userData.lockPeriod,
            policies[0].lockEffectivePeriod
          );
          if (check === "GREATER" || check === "EQUAL") {
            return userData.update({
              loginAttempts: 0,
              firstLoginAttempt: null,
              lockPeriod: null,
            });
          } else if (check === "LESSER") {
            throw new Error(`"Account Locked: Exceeded login attempts."`);
          }
        } else {
          return userData.update({
            loginAttempts: 0,
            firstLoginAttempt: null,
            lockPeriod: null,
          });
        }
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  exports.countCharacterDifferences = async (password, newPassword) => {
    const policies = await findAllPasswordPolicies();
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
      if (differenceCount >= policies.minChangeChars) {
        return true;
      } else return false;
    } else {
      return true;
    }
  };
  