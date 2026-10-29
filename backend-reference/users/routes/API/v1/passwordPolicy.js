
const router = (module.exports = require("express")());


const  {getAllPasswordPolicies}=require('../../../controllers/passwordPolicy')



router.post("/passwordPolicies",getAllPasswordPolicies)



