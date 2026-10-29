const express = require('express');
const { userDetails } = require('../../../../controllers/admin/corporateUser');
const router = express.Router({mergeParams:true})
const {
    findOneSystemUser,
    updateSystemUser
} = require("../../../../controllers/admin/systemUser")
const {
    changePassword
} = require("../../../../controllers/admin/credential")
const { validateSystemUserProfile, validateChangePassword } = require('../../../../utils/apiValidation');

// F-OTH-03: requireSystemUser (applied router-wide in systemUser/index.js) only checks the
// outer :userId segment (/system_user/:userId/others/...) — it never looks at this route's
// own :id param, so any system user could read or edit ANY other system user's profile.
// This endpoint is self-service by design (admins editing others belongs on the already
// admin-gated /users/system-users/:id route instead), so :id must equal the caller's own id.
const requireOwnProfile = (req, res, next) => {
    if (String(req.params.id) !== String(req.user.id)) {
        return res.status(403).json({
            status: false,
            message: "Unauthorized access.",
            data: {},
            responseCode: "001",
        });
    }
    return next();
};

router.get("/walletDetails", userDetails)//✅
router.get("/profileDetails/:id", requireOwnProfile, findOneSystemUser)//✅
router.put("/:id", requireOwnProfile, validateSystemUserProfile,  updateSystemUser)//✅
router.patch("/password/change",validateChangePassword, changePassword)

module.exports = router