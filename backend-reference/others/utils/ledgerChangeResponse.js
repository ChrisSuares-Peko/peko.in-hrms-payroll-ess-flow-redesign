const ErrorResponse = require("./error-response");
const { OUTCOMES } = require("../models/use-cases/ledgerEntryChanges");

const sent = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const answerLedgerChange = (res, next, result, { noun, verb, serialize }) => {
    const lower = noun.toLowerCase();
    if (result.outcome === OUTCOMES.missing) {
        return next(new ErrorResponse(`${noun} not found`, 404));
    }
    if (result.outcome === OUTCOMES.pendingRemoval) {
        return next(
            new ErrorResponse(
                `This ${lower} is deleted and waiting to be removed from the books, so it can no longer be changed`,
                409
            )
        );
    }
    if (result.outcome === OUTCOMES.reversed) {
        return next(
            new ErrorResponse(`This ${lower} was reversed, so it can no longer be changed or deleted`, 409)
        );
    }
    if (result.outcome === OUTCOMES.refused) return next(new ErrorResponse(result.reason, 409));
    if (result.outcome === OUTCOMES.unchanged) {
        return next(new ErrorResponse("Nothing was changed on this entry", 400));
    }
    const message =
        result.outcome === OUTCOMES.deleted
            ? `${noun} deleted. Mark it removed from the books to take it off the portal`
            : `${noun} ${verb} successfully`;
    return sent(res, serialize(result.row), message);
};

const answerBooksTag = (res, next, result, { noun, serialize }) => {
    if (result.outcome === OUTCOMES.missing) {
        return next(new ErrorResponse(`${noun} not found`, 404));
    }
    const removed = result.outcome === OUTCOMES.removed;
    let message = `${noun} was already marked that way`;
    if (removed) message = `${noun} removed from the portal`;
    else if (result.outcome === OUTCOMES.updated) {
        message = result.row.booksSynced
            ? `${noun} marked as in the books`
            : `${noun} marked as not in the books`;
    }
    return sent(res, { ...serialize(result.row), removed }, message);
};

const NOT_VALUES = ["changeReason", "slipBase64", "slipName", "slipFormat"];

const changeOf = body => ({
    changeReason: body.changeReason,
    values: Object.fromEntries(Object.entries(body).filter(([key]) => !NOT_VALUES.includes(key))),
});

const withReversal = (row, label) => (row.entryType === "REVERSAL" ? `${label} reversal` : label);

module.exports = { answerLedgerChange, answerBooksTag, changeOf, withReversal };
