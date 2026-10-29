const { getValue, setValue, incrementCount } = require("../utils/cacheDataMethods");
const { customLog } = require("../utils/loggerHelper");
const { findUsername, findOneCredential } = require("../models/use-cases/signUp");

const USERNAME_COUNTER_KEY = 'signup:username:counter';
let uuID = "10000000";

function getUuid(i) {
    return uuID.substring(0, uuID.length - (i.length - 1)) + i;
}

async function initializeCounterIfNeeded() {
    const exists = await getValue(USERNAME_COUNTER_KEY);
    if (!exists) {
        const lastUser = await findOneCredential({ attributes: ['username'] });
        let count = 0;
        if (lastUser && lastUser.username) {
            const match = lastUser.username.match(/\d+$/);
            if (match) count = parseInt(match[0], 10);
        }
        await setValue(USERNAME_COUNTER_KEY, null, String(count));
        customLog(null, 'info', `Initialized Redis counter to ${count}`);
    }
}

async function generateUniqueUsername() {
    await initializeCounterIfNeeded();

    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
        const count = await incrementCount(USERNAME_COUNTER_KEY);
        const username = getUuid(count.toString());

        const existingUser = await findUsername(username);
        if (!existingUser || existingUser.username !== username) {
            return username;
        }

        attempts++;
    }

    throw new Error('Failed to generate unique username after multiple attempts');
}

module.exports = generateUniqueUsername;
