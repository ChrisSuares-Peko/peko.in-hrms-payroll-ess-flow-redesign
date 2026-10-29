const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { findAllAirportsPaginated, findAirportByCode, setAirportPriority, createAirport } = require("../../models/use-cases/airport");

exports.getAirports = asyncHandler(async (req, res) => {
    const { page = 1, itemsPerPage = 15, sort = 'ASC', sortField = 'id', searchText = '' } = req.query;
    const result = await findAllAirportsPaginated({
        searchText,
        page: Number(page),
        itemsPerPage: Number(itemsPerPage),
        sort,
        sortField,
    });
    res.status(200).json({ status: true, message: 'Airports fetched successfully', data: result, responseCode: '000' });
});

exports.addAirport = asyncHandler(async (req, res, next) => {
    const { airportCode, airportName, cityCode, cityName, countryCode, countryName, priority } = req.body;
    const existing = await findAirportByCode(airportCode);
    if (existing) {
        return next(new ErrorResponse(`Airport with code '${airportCode}' already exists`, 409));
    }
    const result = await createAirport({ airportCode, airportName, cityCode, cityName, countryCode, countryName, priority });
    res.status(201).json({ status: true, message: 'Airport created successfully', data: result, responseCode: '000' });
});

exports.updateAirportPriority = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { priority } = req.body;
    if (!id) return next(new ErrorResponse('Airport ID is required', 400));
    await setAirportPriority(id, priority);
    res.status(200).json({ status: true, message: 'Airport priority updated successfully', data: {}, responseCode: '000' });
});
