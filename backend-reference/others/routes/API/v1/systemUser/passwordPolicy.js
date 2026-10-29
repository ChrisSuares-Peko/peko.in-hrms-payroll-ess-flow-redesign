
const router = (module.exports = require("express")());


// const  {create,update,getAllPasswordPolicies,deletePasswordPolicy}=require('../../../controllers/passwordPolicy')
const  {update,getAllPasswordPolicies,deletePasswordPolicy}=require('../../../../controllers/admin/passwordPolicy')

const {validatePasswordPolicy}=require("../../../../utils/validation/passwordPolicyApiValidation")


router.put("/:id",validatePasswordPolicy,update)
router.get("/",getAllPasswordPolicies)
router.delete("/:id",deletePasswordPolicy)



