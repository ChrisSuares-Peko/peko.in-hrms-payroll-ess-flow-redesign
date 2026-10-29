

const asyncHandler = require("../middlewares/async");
const { findOneCredentialWithUsername } = require("../models/use-cases/credential");


const {createPasswordPolicy,updatePasswordPolicy,findAllPasswordPolicies,deletePasswordPolicy} = require("../models/use-cases/passwordPolicy");


exports.create = asyncHandler(async (req, res) => {
  
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

exports.update =asyncHandler(async (req, res) => {
    const policyId = req.params.id;  
    const updateData = req.body;

    const [updated] = await updatePasswordPolicy(policyId, updateData);

    if (updated === 0) {  
        return res.status(404).json({
            status: false,
            message: 'Password policy not found or no changes made',
            data: {},
            responseCode: '404'
        });
    }

    return res.status(200).json({
        status: true,
        message: 'Password policy updated successfully',
        data: {},
        responseCode: '200'
    });

})
exports.getAllPasswordPolicies = asyncHandler(async (req, res) => {
    const username=req.body.username
    const userData=await findOneCredentialWithUsername(username)
    let policies=undefined
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

  

    
    if(userData&&userData.passwordProtection){
         policies = await findAllPasswordPolicies();
         

    }
    // if (!policies||!userData.passwordProtection) {
    //     return res.status(404).json({
    //         status: false,
    //         message: 'No password policies found',
    //         data: {},
    //         responseCode: '404'
    //     });
    // }

    if (!policies || policies.length === 0||!userData.passwordProtection) {
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
        data: policies,
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

