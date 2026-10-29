
const router = (module.exports = require("express")());


// const  {create,update,getAllPasswordPolicies,deletePasswordPolicy}=require('../../../controllers/passwordPolicy')
const  {getAllPasswordPolicies}=require('../../../../controllers/admin/passwordPolicy')


router.get("/",getAllPasswordPolicies)



