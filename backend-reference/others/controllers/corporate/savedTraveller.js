const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middlewares/async');
const savedTravellerUseCase = require('../../models/use-cases/savedTraveller');

const ALLOWED_FIELDS = [
    'title', 'firstName', 'lastName', 'gender', 'paxType', 'dateOfBirth',
    'passportNo', 'passportExpiry', 'passportIssueDate', 'passportIssueCountryCode',
    'addressLine1', 'addressLine2', 'city', 'cellCountryCode', 'contactNo', 'email',
    'nationality', 'countryCode', 'countryName', 'pan',
];

const DATE_FIELDS = ['dateOfBirth', 'passportExpiry', 'passportIssueDate'];

const toDateOrNull = (v) => {
    if (!v || v === 'Invalid date') return null;
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const pickTravellerFields = (body) => {
    const out = {};
    ALLOWED_FIELDS.forEach((key) => {
        if (body[key] !== undefined) out[key] = body[key];
    });
    if (out.passportNo) out.passportNo = String(out.passportNo).toUpperCase();
    DATE_FIELDS.forEach((key) => {
        if (key in out) out[key] = toDateOrNull(out[key]);
    });
    return out;
};

const resolveSubCorporateUserId = (req) =>
    req.user.role === 'CORPORATE_SUB_USER' ? req.user.subCorporateId : null;

exports.addSavedTraveller = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const { type } = req.body;
    if (!type) return next(new ErrorResponse('Service type is required', 400));

    const fields = pickTravellerFields(req.body);
    if (!fields.firstName || !fields.lastName) {
        return next(new ErrorResponse('First name and last name are required', 400));
    }
    const subCorporateUserId = resolveSubCorporateUserId(req);
    const config = await savedTravellerUseCase.resolveConfig();

    const { match, count } = await savedTravellerUseCase.findDuplicateWithCount(
        {
            credentialId,
            type,
            subCorporateUserId,
            firstName: fields.firstName,
            lastName: fields.lastName,
            dateOfBirth: fields.dateOfBirth,
            passportNo: fields.passportNo,
            contactNo: fields.contactNo,
            email: fields.email,
        },
        config
    );

    if (match) {
        return res.status(200).json({
            status: true,
            data: match,
            message: 'Traveller already saved',
            responseCode: '000',
        });
    }

    const limit = savedTravellerUseCase.limitFor(config, type);
    if (count >= limit) {
        return res.status(200).json({
            status: false,
            data: { limit, count },
            message: `You can save up to ${limit} travellers. Remove one before adding another.`,
            responseCode: '003',
        });
    }

    const created = await savedTravellerUseCase.create({
        ...fields,
        type,
        credentialId,
        subCorporateUserId,
        status: 'ACTIVE',
    });
    return res.status(201).json({
        status: true,
        data: created,
        message: 'Traveller saved successfully',
        responseCode: '000',
    });
});

exports.getSavedTravellers = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const { type, searchText } = req.query;
    if (!type) return next(new ErrorResponse('Service type is required', 400));
    const subCorporateUserId = resolveSubCorporateUserId(req);

    const config = await savedTravellerUseCase.resolveConfig();
    const data = await savedTravellerUseCase.findAll(
        { credentialId, type, searchText, subCorporateUserId },
        config
    );
    const limit = savedTravellerUseCase.limitFor(config, type);
    return res.status(200).json({
        status: true,
        data,
        limit,
        message: 'Saved travellers fetched successfully',
        responseCode: '000',
    });
});

exports.updateSavedTraveller = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const subCorporateUserId = resolveSubCorporateUserId(req);
    const existing = await savedTravellerUseCase.findOne(req.params.id, credentialId, subCorporateUserId);
    if (!existing) return next(new ErrorResponse('Saved traveller not found', 404));

    await savedTravellerUseCase.update(
        req.params.id,
        credentialId,
        subCorporateUserId,
        pickTravellerFields(req.body)
    );
    const refreshed = await savedTravellerUseCase.findOne(req.params.id, credentialId, subCorporateUserId);
    return res.status(200).json({
        status: true,
        data: refreshed,
        message: 'Traveller updated successfully',
        responseCode: '000',
    });
});

exports.deleteSavedTraveller = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const subCorporateUserId = resolveSubCorporateUserId(req);
    const existing = await savedTravellerUseCase.findOne(req.params.id, credentialId, subCorporateUserId);
    if (!existing) return next(new ErrorResponse('Saved traveller not found', 404));

    await savedTravellerUseCase.softDelete(req.params.id, credentialId, subCorporateUserId);
    return res.status(200).json({
        status: true,
        data: {},
        message: 'Traveller removed successfully',
        responseCode: '000',
    });
});
