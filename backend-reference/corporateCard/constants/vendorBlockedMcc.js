
const VENDOR_BLOCKED_MCCS = [
    // '6010', // Manual cash disbursements
    // '6011', // Automated cash disbursements (ATM)
    '6012',
    '6051',
    '6211',
    '7012',
    '4829',
    '5932',
    '5933',
    '5937',
    '5960',
    '5970',
    '5971',
    '5972',
    '5973',
    '5993',
    '7277',
    '7273',
    '7297',
    '7321',
    '7361',
    '7375',
    '7393',
    '7399',
    '7995',
    '8651',
]

const isVendorBlockedMcc = (mcc) => mcc !== null && mcc !== undefined && VENDOR_BLOCKED_MCCS.includes(String(mcc))

module.exports = { VENDOR_BLOCKED_MCCS, isVendorBlockedMcc }
