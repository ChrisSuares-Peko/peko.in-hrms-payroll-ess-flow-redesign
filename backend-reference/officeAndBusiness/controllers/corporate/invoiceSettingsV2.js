const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFile: uploadFileToFirebase, deleteFile: deleteFromFirebase } = require("../../utils/commonUploadFile");
const {
    findSettings,
    saveSettings,
    saveDocumentTypePrefixes,
} = require("../../models/use-cases/invoiceSettingsV2");

// GET /invoicing/v2/settings
// Returns all invoice settings for the logged-in corporate user
exports.getSettings = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;

        const settings = await findSettings(corporateUserId);

        return res.status(200).json({
            status: true,
            data: settings || {},
            message: "Invoice settings fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /invoicing/v2/settings
// Save business details + optional logo/signature upload + document type settings in one call
// Body: {
//   businessName, address, city, state, pincode, phoneNumber, email, gstNo,
//   logo: { file, format }, signature: { file, format },
//   documentType, prefix, autoUpdateDocumentNumber, termsAndConditions, notes
// }
exports.saveSettings = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const {
            signature, removeSignature,
            documentPrefixes, autoUpdateDocumentNumber, termsAndConditions, notes, autoAddToCatalog,
            gstPercent, currency, paymentMode, defaultDueDays, templateSettings,
        } = req.body;

        const firebaseBasePath = `${req.user.role ? req.user.role.toLowerCase() : 'corporate'}/${corporateUserId}/invoicing/settings`;

        const existing = await findSettings(corporateUserId);

        const updateData = {
            autoUpdateDocumentNumber, termsAndConditions, notes, autoAddToCatalog,
            gstPercent, currency, paymentMode, defaultDueDays,
            ...(templateSettings !== undefined && { templateSettings }),
        };

        // Handle signature: remove if flagged, else upload if new file provided
        if (removeSignature) {
            if (existing?.signatureUrl) {
                await deleteFromFirebase(existing.signatureUrl).catch(() => null);
            }
            updateData.signatureUrl = null;
        } else if (signature?.file) {
            if (existing?.signatureUrl) {
                await deleteFromFirebase(existing.signatureUrl).catch(() => null);
            }
            const base64Data = (signature.file.includes("base64,") ? signature.file.split("base64,")[1] : signature.file).trim();
            const signatureFormat = signature.format.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            updateData.signatureUrl = await uploadFileToFirebase(
                base64Data,
                firebaseBasePath,
                signatureFormat,
                5
            );
        }

        const updatedSettings = await saveSettings(corporateUserId, updateData);

        // ── Document Type Prefixes ────────────────────────────────────────────
        let updatedDocSettings = updatedSettings;

        if (Array.isArray(documentPrefixes) && documentPrefixes.length > 0) {
            // Check if any prefix conflicts with a different document type
            const currentPrefixes = updatedSettings?.documentNumberPrefix || [];
            for (const { type, prefix } of documentPrefixes) {
                const conflictingType = currentPrefixes.find(
                    item => item.type !== type && item.prefix?.toUpperCase() === prefix.toUpperCase()
                );
                if (conflictingType) {
                    return res.status(400).json({
                        status: false,
                        message: `Prefix "${prefix}" is already used by ${conflictingType.type.replace(/_/g, ' ')}. Please use a different prefix.`,
                        data: {},
                        responseCode: "001",
                    });
                }
            }

            updatedDocSettings = await saveDocumentTypePrefixes(corporateUserId, documentPrefixes);
        }

        return res.status(200).json({
            status: true,
            data: updatedDocSettings,
            message: "Settings saved successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});
