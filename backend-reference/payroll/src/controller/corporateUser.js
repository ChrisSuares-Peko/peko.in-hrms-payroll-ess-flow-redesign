const asyncHandler = require("../middleware/async");
const CorporateUser = require('../models/entities/corporateUser');
const ErrorResponse = require('../utils/error-response');
const { updateCorporateUserEmail } = require("../models/use-cases/corporateUser");

exports.createCorporateUser = asyncHandler(async (req, res) => {

    const { corporateUserID, email } = req.body;
    const newCorporateUser = new CorporateUser({ _id: corporateUserID, email });
    const savedCorporateUser = await newCorporateUser.save();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'CorporateUser added successfully',
        data: savedCorporateUser
    });

})

exports.getAllCorporates = asyncHandler(async (req, res) => {

    const corporateUsers = await CorporateUser.find({});
    return res.status(200).json({
        status: true,
        message: 'Retrieved all CorporateUsers',
        responseCode: '000',
        data: { corporateUsers }
    });

})

exports.getCorporate = asyncHandler(async (req, res, next) => {

    const corporateUser = await CorporateUser.findById(req.params.id);
    if (!corporateUser) {
        return next(new ErrorResponse('CorporateUser not found', 404))
    }
    return res.status(200).json({
        status: true,
        message: 'Retrieved CorporateUser',
        responseCode: '000',
        data: corporateUser
    });

})

exports.updateCorporate = asyncHandler(async (req, res, next) => {

    const { email } = req.body;
    const userId = req.params.id;

    const updatedCorporateUser = await updateCorporateUserEmail(userId, email);
    if (!updatedCorporateUser) {
        return next(new ErrorResponse('CorporateUser not found', 404))
    }
    return res.status(200).json({
        status: true,
        message: 'CorporateUser updated successfully',
        responseCode: '000',
        data: updatedCorporateUser
    });

})

exports.deleteCorporate = asyncHandler(async (req, res, next) => {

    const deletedCorporateUser = await CorporateUser.findByIdAndDelete(req.params.id);

    if (!deletedCorporateUser) {
        return next(new ErrorResponse('CorporateUser not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'CorporateUser deleted successfully',
        data: deletedCorporateUser
    });

})