const moment = require("moment");
const { getValue, setValue } = require("./cacheDataMethods");


const generatePekoInvoiceId = async () => {
    const date = moment().format("YYYYMMDD");
    const key = `invoice:${date}`;

    let count = await getValue(key);
    count = Number(count) || 0;
    count += 1;

    if (count === 1) {
        const ttl = moment().endOf("day").diff(moment(), "seconds");
        await setValue(key, ttl, String(count));
    } else {
        await setValue(key, 0, String(count));
    }

    const padded = String(count).padStart(6, "0");
    return `INV-${date}-${padded}`;

}

const generatePekoReceiptId = async () => {
    const date = moment().format("YYYYMMDD");
    const key = `receipt:${date}`;

    let count = await getValue(key);
    count = Number(count) || 0;
    count += 1;

    // Set key with expiry if it's the first one
    if (count === 1) {
        const ttl = moment().endOf("day").diff(moment(), "seconds");
        await setValue(key, ttl, String(count));
    } else {
        await setValue(key, 0, String(count));
    }

    const padded = String(count).padStart(6, "0");
    return `${date}${padded}`;

}

module.exports = { generatePekoInvoiceId, generatePekoReceiptId };
