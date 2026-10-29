// GST state codes as notified under the GST regime (first 2 digits of a GSTIN).
const GST_STATE_CODES = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu",
    "27": "Maharashtra",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
    "97": "Other Territory",
};

// Common alternate spellings that appear in free-text state fields.
const STATE_NAME_ALIASES = {
    "orissa": "21",
    "pondicherry": "34",
    "uttaranchal": "05",
    "newdelhi": "07",
    "jammukashmir": "01",
    "damananddiu": "26",
    "dadraandnagarhaveli": "26",
};

const normalizeStateName = (stateName) =>
    String(stateName || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

const STATE_NAME_TO_CODE = Object.entries(GST_STATE_CODES).reduce(
    (acc, [code, name]) => {
        acc[normalizeStateName(name)] = code;
        return acc;
    },
    {}
);

// Resolves the 2-digit GST state code of a party.
// GSTIN prefix wins (authoritative); falls back to the free-text state name.
// Returns null when neither resolves.
const resolveStateCode = ({ gstNumber, stateName } = {}) => {
    const gstin = String(gstNumber || "").trim();
    if (gstin.length >= 2) {
        const prefix = gstin.substring(0, 2);
        if (GST_STATE_CODES[prefix]) {
            return prefix;
        }
    }

    const normalized = normalizeStateName(stateName);
    if (!normalized) {
        return null;
    }
    return STATE_NAME_TO_CODE[normalized] || STATE_NAME_ALIASES[normalized] || null;
};

const getStateName = (code) => GST_STATE_CODES[code] || null;

module.exports = { GST_STATE_CODES, resolveStateCode, getStateName };
