const asyncHandler = require("../../middlewares/async");
const { findOneCredential } = require("../../models/use-cases/credential");



const {createPasswordPolicy,updatePasswordPolicy,findAllPasswordPolicies,deletePasswordPolicy} = require("../../models/use-cases/passwordPolicy");


exports.create = asyncHandler(async (req, res) => {
  console.log("create called")
    const policyData = req.body;
     
   
    const result = await createPasswordPolicy(policyData);

   
    if (result.status) {
        return res.status(201).json({
            status: true,
            message: 'Password policy created successfully',
            data: result.data,
            responseCode: '000'
        });
    } else {
        return res.status(400).json({
            status: false,
            message: result.message,
            data: {},
            responseCode: '001'
        });
    }
});



exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
  
    try {
      const updated = await updatePasswordPolicy(updateData, id);
  
      return res.status(200).json({
        status: true,
        message: 'Password policy updated successfully',
        data: updated,
        responseCode: '000',
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message || 'An error occurred',
        responseCode: '001',
      });
    }
  });
  
exports.getAllPasswordPolicies = asyncHandler(async (req, res) => {
    
    let policies = [];
     // SYSTEM_USER should fetch all policies directly
     if (req.user.role === 'SYSTEM_USER') {
        policies = await findAllPasswordPolicies();
    } else {
        const credentialData = await findOneCredential({ id: req.user.id });
        
        if (credentialData && credentialData.passwordProtection) {
            policies = await findAllPasswordPolicies();
        }
    }

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
      
        return res.status(200).json({
            status: true,
            message: 'Default password policy applied',
            data: { data: [defaultPasswordPolicy] },
            responseCode: '000'
        });
    }

 

    return res.status(200).json({
        status: true,
        message: 'Password policies fetched successfully',
        data: {data:policies},
        responseCode: '200'
    });
});


exports.deletePasswordPolicy=asyncHandler(async (req, res) => {

    const { id } = req.params;

    const result = await deletePasswordPolicy(id);

    if (result === 0) {
        return res.status(404).json({
            status: false,
            message: 'Password policy not found',
            data: {},
            responseCode: '404'
        });
    }

    return res.status(200).json({
        status: true,
        message: 'Password policy deleted successfully',
        data: {},
        responseCode: '200'
    });

})
