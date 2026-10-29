const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const {getAllKybVerifications,updateStatus}=require("../../models/use-cases/kybVerification")
const kybVerification =require("../../models/entities/kybVerification")
const { resolvePartnerScope } = require('../../utils/partnerScope')
exports.findAllKybVerifications = asyncHandler(async (req, res, next) => {
    try {

        let { from, to, searchText, page, itemsPerPage } = req.query
         const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC'
          let column = 'createdAt'
          page = page ? parseInt(page) : 1
          itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null
          let limit = itemsPerPage
           // Calculate offset based on page and itemsPerPage
           let offset
           if (page && itemsPerPage) {
                offset = (page - 1) * itemsPerPage
           }
           // F-OTH-06: without this, any system user could list every partner's corporate
           // KYB data (PAN/GST/business documents), not just their own partner's.
           const { partnerId } = resolvePartnerScope(req);
           let params = {
            limit,
            offset,
            from,
            to,
            sort,
            searchText,
            column,
            partnerId,
       }
        const kybVerifications = await getAllKybVerifications(params);

        return res.json({
            success: true,
            data: kybVerifications,
            message: "KYB verifications fetched successfully",
            responseCode: '000',

        });
    } catch (error) {
        next(error); // Pass error to middleware
    }
});



exports.updateVerificationStatus = asyncHandler(async (req, res, next) => {
    try {
        const id=req.params.id
        
        const kybRecord = await kybVerification.findOne({
            where: { id: id }
        });
        if(!kybRecord){
            return next(new ErrorResponse(`Something went wrong while getting kyb record`, 500));
        }
        const corporateUserId = kybRecord.corporateUserId;

        const { panVerified, gstVerified } = req.body;
// F-OTH-06: without this, any system user could approve/reject PAN/GST verification for
// a corporate under a different partner's tenant, just by guessing the kyb record id.
const { partnerId } = resolvePartnerScope(req);
let params={
    corporateUserId,
    panVerified,
    gstVerified,
    partnerId,
}
        
        const result = await updateStatus(params);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        return res.status(200).json(result); 
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});



