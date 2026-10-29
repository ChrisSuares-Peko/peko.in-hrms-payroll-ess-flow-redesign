/* eslint-disable no-undef */
const crypto = require('crypto');
const axios = require('axios');
const { setValue } = require('../utils/cacheDataMethods');
const { customLog } = require('../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');

const RSA_PUBLIC_KEY = (process.env.RSA_PUBLIC_KEY || '').replace(/\\n/g, '\n');

const TOKEN_TTL = 3500;

// Frontend state name → Alankit state code (from Alankit GSP doc)
const STATE_CODE_MAP = {
    'Jammu and Kashmir': '1',         // 1  - JAMMU AND KASHMIR
    'Himachal Pradesh': '2',          // 2  - HIMACHAL PRADESH
    'Punjab': '3',                    // 3  - PUNJAB
    'Chandigarh': '4',                // 4  - CHANDIGARH
    'Uttarakhand': '5',               // 5  - UTTARAKHAND
    'Haryana': '6',                   // 6  - HARYANA
    'Delhi': '7',                     // 7  - DELHI
    'Rajasthan': '8',                 // 8  - RAJASTHAN
    'Uttar Pradesh': '9',             // 9  - UTTAR PRADESH
    'Bihar': '10',                    // 10 - BIHAR
    'Sikkim': '11',                   // 11 - SIKKIM
    'Arunachal Pradesh': '12',        // 12 - ARUNACHAL PRADESH
    'Nagaland': '13',                 // 13 - NAGALAND
    'Manipur': '14',                  // 14 - MANIPUR
    'Mizoram': '15',                  // 15 - MIZORAM
    'Tripura': '16',                  // 16 - TRIPURA
    'Meghalaya': '17',                // 17 - MEGHALAYA
    'Assam': '18',                    // 18 - ASSAM
    'West Bengal': '19',              // 19 - WEST BENGAL
    'Jharkhand': '20',                // 20 - JHARKHAND
    'Odisha': '21',                   // 21 - ORISSA
    'Chhattisgarh': '22',             // 22 - CHHATTISGARH
    'Madhya Pradesh': '23',           // 23 - MADHYA PRADESH
    'Gujarat': '24',                  // 24 - GUJARAT
    'Dadra and Nagar Haveli and Daman and Diu': '26', // 26 - DADAR AND NAGAR HAVELI
    'Maharashtra': '27',              // 27 - MAHARASTRA
    'Karnataka': '29',                // 29 - KARNATAKA
    'Goa': '30',                      // 30 - GOA
    'Lakshadweep': '31',              // 31 - LAKSHADWEEP
    'Kerala': '32',                   // 32 - KERALA
    'Tamil Nadu': '33',               // 33 - TAMIL NADU
    'Puducherry': '34',               // 34 - PUDUCHERRY
    'Andaman and Nicobar Islands': '35', // 35 - ANDAMAN AND NICOBAR
    'Telangana': '36',                // 36 - TELANGANA
    'Andhra Pradesh': '37',           // 37 - ANDHRA PRADESH
    'Ladakh': '38',                   // 38 - LADAKH
};


const generateAppKey = () => crypto.randomBytes(32);

const rsaEncrypt = (base64Data) => {
    const encrypted = crypto.publicEncrypt(
        { key: RSA_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(base64Data, 'utf8')
    );
    return encrypted.toString('base64');
};

const aesDecrypt = (cipherBase64, keyBytes) => {
    const decipher = crypto.createDecipheriv('aes-256-ecb', keyBytes, null);
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(cipherBase64, 'base64')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
};


//fetch vendor details from DB
exports.fetchVendorDetails = async () => {
    try {
        const vendor = await findServiceOperatorByAccessKey('alankit_einvoice');
        if (!vendor || vendor.error) throw new Error('eInvoice service unavailable');
        return vendor;
    } catch (error) {
        customLog(null, 'error', { error: error.message });
        throw new Error('Apologies, the service you are trying to access is currently unavailable.');
    }
};

exports.aesEncrypt = (plainText, sekBase64) => {
    const key = Buffer.from(sekBase64, 'base64');
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    cipher.setAutoPadding(true);
    const encrypted = Buffer.concat([
        cipher.update(Buffer.from(plainText, 'utf8')),
        cipher.final(),
    ]);
    return encrypted.toString('base64');
};

exports.aesDecryptWithSek = (cipherBase64, sekBase64) => {
    const key = Buffer.from(sekBase64, 'base64');
    return aesDecrypt(cipherBase64, key);
};

exports.getEInvoiceAuth = async (gstin, username, password, corporateUserId, forceRefresh = true) => {
    // fetch vendor details from DB
    const { vendor: { apiUrl: baseUrl, optional1: subscriptionKey } } = await exports.fetchVendorDetails();

    const appKeyBytes = generateAppKey();
    const appKeyBase64 = appKeyBytes.toString('base64');

    const payload = JSON.stringify({
        UserName: username,
        Password: password,
        AppKey: appKeyBase64,
        ForceRefreshAccessToken: forceRefresh,
    });

    const payloadBase64 = Buffer.from(payload, 'utf8').toString('base64');
    const encryptedData = rsaEncrypt(payloadBase64);

    const response = await axios.post(
        `${baseUrl}/eivital/v1.04/auth`,
        { Data: encryptedData },
        {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Gstin: gstin,
                'Content-Type': 'application/json',
            },
        }
    );

    const { Status, Data, ErrorDetails } = response.data;

    if (Status !== 1) {
        const errMsg = ErrorDetails?.[0]?.ErrorMessage || 'eInvoice authentication failed';
        customLog(null, 'error', { error: 'eInvoice auth failed', gstin, ErrorDetails }, 'VENDOR');
        throw new Error(errMsg);
    }

    const { AuthToken, Sek, TokenExpiry } = Data;

    const sekDecipher = crypto.createDecipheriv('aes-256-ecb', appKeyBytes, null);
    sekDecipher.setAutoPadding(true);
    const sekBuffer = Buffer.concat([
        sekDecipher.update(Buffer.from(Sek, 'base64')),
        sekDecipher.final(),
    ]);
    const sekBase64 = sekBuffer.toString('base64');

    const authData = { authToken: AuthToken, sek: sekBase64, tokenExpiry: TokenExpiry, gstin, username };

    const ttl = TokenExpiry
        ? Math.max(Math.floor((new Date(TokenExpiry).getTime() - Date.now()) / 1000), 60)
        : TOKEN_TTL;

    const cacheKey = `einvoice_auth_${AuthToken}`;
    await setValue(cacheKey, ttl, JSON.stringify(authData));

    if (corporateUserId) {
        const sessionKey = `einvoice_session_${corporateUserId}`;
        await setValue(sessionKey, ttl, JSON.stringify({ authToken: AuthToken, tokenExpiry: TokenExpiry, gstin, username }));
    }

    return authData;
};

exports.calculateInvoiceTotals = (invoiceData) => {
    const { lineItems, igstOnIntraState, sellerDetails, placeOfSupply } = invoiceData;

    const sellerCode = STATE_CODE_MAP[sellerDetails?.stateCode] || sellerDetails?.stateCode;
    const posCode = STATE_CODE_MAP[placeOfSupply] || placeOfSupply;
    const isSameState = !!(sellerCode && posCode && sellerCode === posCode);
    const isInterState = !!(sellerCode && posCode && sellerCode !== posCode);
    const toggleOn = igstOnIntraState === true || igstOnIntraState === 'true' || igstOnIntraState === 'Y';
    const useIgst = isInterState || (isSameState && toggleOn);

    let totalTaxableValue = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalDiscount = 0;

    const calculatedItems = lineItems.map((item) => {
        const unitPrice = parseFloat(item.unitPrice || 0);
        const quantity = parseFloat(item.quantity || 0);
        const discountAmt = parseFloat(item.discount || 0);
        const gstRate = parseFloat(item.gstRate || 0);

        const preTaxVal = parseFloat((unitPrice * quantity).toFixed(2));
        const taxableAmount = parseFloat((preTaxVal - discountAmt).toFixed(2));
        const totalGst = parseFloat((taxableAmount * gstRate / 100).toFixed(2));

        let igstAmount = 0, cgstAmount = 0, sgstAmount = 0;
        if (useIgst) {
            igstAmount = totalGst;
        } else {
            cgstAmount = parseFloat((taxableAmount * gstRate / 2 / 100).toFixed(2));
            sgstAmount = parseFloat((taxableAmount * gstRate / 2 / 100).toFixed(2));
        }

        const itemTotal = parseFloat((taxableAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2));

        totalTaxableValue += taxableAmount;
        totalIgst += igstAmount;
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalDiscount += discountAmt;

        return {
            ...item,
            preTaxValue: preTaxVal,
            taxableAmount,
            igstAmount,
            cgstAmount,
            sgstAmount,
            itemTotal,
        };
    });

    totalTaxableValue = parseFloat(totalTaxableValue.toFixed(2));
    totalIgst = parseFloat(totalIgst.toFixed(2));
    totalCgst = parseFloat(totalCgst.toFixed(2));
    totalSgst = parseFloat(totalSgst.toFixed(2));
    totalDiscount = parseFloat(totalDiscount.toFixed(2));
    const totalAmount = parseFloat((totalTaxableValue + totalIgst + totalCgst + totalSgst).toFixed(2));

    return {
        ...invoiceData,
        lineItems: calculatedItems,
        totalTaxableValue,
        totalIgst,
        totalCgst,
        totalSgst,
        totalDiscount,
        totalAmount,
    };
};

const getStateCode = (stateName) => STATE_CODE_MAP[stateName] || stateName;

const toYN = (val) => {
    if (val === true || val === 'true' || val === 'Y') return 'Y';
    return 'N';
};

const buildAlankitPayload = (data) => ({
    Version: '1.1',
    TranDtls: {
        TaxSch: 'GST',
        SupTyp: data.supplyType,
        RegRev: toYN(data.reverseCharge),
        IgstOnIntra: toYN(data.igstOnIntraState),
    },
    DocDtls: {
        Typ: data.docType,
        No: data.prefix ? `${data.prefix}${data.docNo}` : data.docNo,
        Dt: data.docDate,
    },
    SellerDtls: {
        Gstin: data.sellerDetails.gstin,
        LglNm: data.sellerDetails.legalName,
        TrdNm: data.sellerDetails.tradeName,
        Addr1: data.sellerDetails.addr1,
        Loc: data.sellerDetails.location,
        Pin: data.sellerDetails.pin,
        Stcd: getStateCode(data.sellerDetails.stateCode),
    },
    BuyerDtls: {
        Gstin: data.buyerDetails.gstin,
        LglNm: data.buyerDetails.legalName,
        TrdNm: data.buyerDetails.tradeName,
        Addr1: data.buyerDetails.addr1,
        Loc: data.buyerDetails.location,
        Pin: data.buyerDetails.pin,
        Stcd: getStateCode(data.buyerDetails.stateCode),
        Pos: getStateCode(data.placeOfSupply),
    },
    ItemList: data.lineItems.map((item, index) => ({
        SlNo: String(index + 1),
        PrdDesc: item.description,
        IsServc: 'N',
        HsnCd: item.hsnCode,
        Qty: item.quantity,
        Unit: item.unit,
        UnitPrice: item.unitPrice,
        Discount: item.discount || 0,
        PreTaxVal: item.preTaxValue ?? (item.unitPrice * item.quantity),
        TotAmt: item.preTaxValue ?? (item.unitPrice * item.quantity),
        AssAmt: item.taxableAmount,
        GstRt: item.gstRate,
        IgstAmt: item.igstAmount || 0,
        CgstAmt: item.cgstAmount || 0,
        SgstAmt: item.sgstAmount || 0,
        CesAmt: item.cessAmount || 0,
        OthChrg: item.otherCharges || 0,
        TotItemVal: item.itemTotal,
    })),
    ValDtls: (() => {
        const assVal   = parseFloat((data.totalTaxableValue || 0).toFixed(2));
        const igstVal  = parseFloat((data.totalIgst || 0).toFixed(2));
        const cgstVal  = parseFloat((data.totalCgst || 0).toFixed(2));
        const sgstVal  = parseFloat((data.totalSgst || 0).toFixed(2));
        const cesVal   = parseFloat((data.totalCess || 0).toFixed(2));
        const stCesVal = parseFloat((data.totalStateCess || 0).toFixed(2));
        const discount = 0; // line-item discounts already applied in AssVal
        const othChrg  = parseFloat((data.totalOtherCharges || 0).toFixed(2));
        const rndOff   = parseFloat((data.roundOffAmount || 0).toFixed(2));
        const totInvVal = parseFloat(
            (assVal + igstVal + cgstVal + sgstVal + cesVal + stCesVal + othChrg + rndOff).toFixed(2)
        );
        return {
            AssVal: assVal,
            CgstVal: cgstVal,
            SgstVal: sgstVal,
            IgstVal: igstVal,
            CesVal: cesVal,
            StCesVal: stCesVal,
            Discount: discount,
            OthChrg: othChrg,
            RndOffAmt: rndOff,
            TotInvVal: totInvVal,
        };
    })(),
});

exports.generateIRNService = async (gstin, username, authToken, sek, invoiceData) => {
    // fetch vendor details from DB
    const { vendor: { apiUrl: baseUrl, optional1: subscriptionKey } } = await exports.fetchVendorDetails();

    const alankitPayload = buildAlankitPayload(invoiceData);
    const invoiceJson = JSON.stringify(alankitPayload);
    const encryptedData = exports.aesEncrypt(invoiceJson, sek);

    const response = await axios.post(
        `${baseUrl}/eicore/v1.03/Invoice`,
        { Data: encryptedData },
        {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Gstin: gstin,
                user_name: username,
                AuthToken: authToken,
                'Content-Type': 'application/json',
            },
        }
    );

    const { Status, Data, ErrorDetails } = response.data;

    if (Status !== 1) {
        const vendorMsg = ErrorDetails?.[0]?.ErrorMessage || '';
        const errorCode = ErrorDetails?.[0]?.ErrorCode || '';
        let errMsg = vendorMsg || 'IRN generation failed';
        if (errorCode === '2258') {
            errMsg = 'Unable to generate IRN. The supplier GSTIN state code does not match the state code provided in the supplier details. Please verify the supplier information and try again.';
        } else if (errorCode === '3028') {
            errMsg = 'The provided GSTIN is invalid. Please verify the GSTIN and try again.';
        } else if (errorCode === '2174') {
            errMsg = 'For inter-state transactions, CGST and SGST are not applicable. Only IGST is applicable.';
        } else if (errorCode === '2176') {
            errMsg = 'Invalid HSN code entered. Please verify and enter a valid HSN code to proceed.';
        } else if (errorCode === '3039') {
            errMsg = "The seller's pincode does not match the selected state. Please verify the address details and try again.";
        } else if (errorCode === '2265') {
            errMsg = 'Recipient GSTIN state code does not match the state code in the recipient details. Please verify the details and try again.';
        }
        customLog(null, 'error', { error: 'generateIRN failed', gstin, vendorMsg, ErrorDetails }, 'VENDOR');
        throw new Error(errMsg);
    }

    const decrypted = exports.aesDecryptWithSek(Data, sek);
    return JSON.parse(decrypted);
};

exports.getGstinDetailsService = async (gstin, username, authToken, sek, searchGstin) => {
    // fetch vendor details from DB
    const { vendor: { apiUrl: baseUrl, optional1: subscriptionKey } } = await exports.fetchVendorDetails();

    const response = await axios.get(
        `${baseUrl}/eivital/v1.04/Master/gstin/${searchGstin}`,
        {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Gstin: gstin,
                user_name: username,
                AuthToken: authToken,
                'Content-Type': 'application/json',
            },
        }
    );

    const { Status, Data, ErrorDetails } = response.data;

    if (Status !== 1) {
        const errMsg = ErrorDetails?.[0]?.ErrorMessage || 'Failed to fetch GSTIN details';
        customLog(null, 'error', { error: 'getGstinDetails failed', gstin: searchGstin, ErrorDetails }, 'VENDOR');
        throw new Error(errMsg);
    }

    const decrypted = exports.aesDecryptWithSek(Data, sek);
    const details = JSON.parse(decrypted);

    const STATE_NAME_MAP = Object.fromEntries(Object.entries(STATE_CODE_MAP).map(([name, code]) => [code, name]));
    if (details.StateCode) details.StateName = STATE_NAME_MAP[String(details.StateCode)] || null;

    return details;
};

exports.generateEwaybillService = async (gstin, username, authToken, sek, irn, transportData) => {
    // fetch vendor details from DB
    const { vendor: { apiUrl: baseUrl, optional1: subscriptionKey } } = await exports.fetchVendorDetails();

    const mode = String(transportData.transMode);
    const isRoadMode = mode === '1';

    const payload = {
        Irn: irn,
        Distance: transportData.distance ? parseInt(transportData.distance, 10) : null,
        TransMode: transportData.transMode,
    };

    if (transportData.transId) payload.TransId = transportData.transId;
    if (transportData.transName) payload.TransName = transportData.transName;

    if (isRoadMode) {
        payload.VehNo = transportData.vehNo || '';
        payload.VehType = transportData.vehType || '';
    }

    if (!isRoadMode) {
        payload.TransDocNo = transportData.transDocNo || '';
        payload.TransDocDt = transportData.transDocDt || '';
    }

    const encryptedData = exports.aesEncrypt(JSON.stringify(payload), sek);

    const response = await axios.post(
        `${baseUrl}/eiewb/v1.03/ewaybill`,
        { Data: encryptedData },
        {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Gstin: gstin,
                user_name: username,
                AuthToken: authToken,
                'Content-Type': 'application/json',
            },
        }
    );

    const { Status, Data, ErrorDetails } = response.data;

    if (Status !== 1) {
        const errMsg = ErrorDetails?.[0]?.ErrorMessage || 'E-Waybill generation failed';
        customLog(null, 'error', { error: 'generateEwaybill failed', gstin, irn, ErrorDetails }, 'VENDOR');
        throw new Error(errMsg);
    }

    const decrypted = exports.aesDecryptWithSek(Data, sek);
    return JSON.parse(decrypted);
};

exports.cancelEwaybillService = async (gstin, username, authToken, sek, ewbNo, cancelRsnCode, cancelRmrk) => {
    // fetch vendor details from DB
    const { vendor: { optional2: baseUrl, optional1: subscriptionKey } } = await exports.fetchVendorDetails();

    const payload = JSON.stringify({
        ewbNo: parseInt(ewbNo, 10),
        cancelRsnCode,
        cancelRmrk: cancelRmrk || '',
    });
    const encryptedData = exports.aesEncrypt(payload, sek);

    const response = await axios.post(
        `${baseUrl}/ewaybillapi/v1.03/ewayapi`,
        { action: 'CANEWB', data: encryptedData },
        {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Gstin: gstin,
                authtoken: authToken,
                'Content-Type': 'application/json',
            },
        }
    );

    const { Status, Data, ErrorDetails } = response.data;

    if (Status !== 1) {
        const errMsg = ErrorDetails?.[0]?.ErrorMessage || 'E-Waybill cancellation failed';
        customLog(null, 'error', { error: 'cancelEwaybill failed', gstin, ewbNo, ErrorDetails }, 'VENDOR');
        throw new Error(errMsg);
    }

    const decrypted = exports.aesDecryptWithSek(Data, sek);
    return JSON.parse(decrypted);
};

exports.cancelIRNService = async (gstin, username, authToken, sek, irn, cancelReason, cancelRemark) => {
   // fetch vendor details from DB
    const { vendor: { apiUrl: baseUrl, optional1: subscriptionKey } } = await exports.fetchVendorDetails();

    const payload = JSON.stringify({
        Irn: irn,
        CnlRsn: cancelReason,
        CnlRem: cancelRemark || '',
    });
    const encryptedData = exports.aesEncrypt(payload, sek);

    const response = await axios.post(
        `${baseUrl}/eicore/v1.03/Invoice/Cancel`,
        { Data: encryptedData },
        {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Gstin: gstin,
                user_name: username,
                AuthToken: authToken,
                'Content-Type': 'application/json',
            },
        }
    );

    const { Status, Data, ErrorDetails } = response.data;

    if (Status !== 1) {
        const errMsg = ErrorDetails?.[0]?.ErrorMessage || 'IRN cancellation failed';
        customLog(null, 'error', { error: 'cancelIRN failed', gstin, irn, ErrorDetails }, 'VENDOR');
        throw new Error(errMsg);
    }

    const decrypted = exports.aesDecryptWithSek(Data, sek);
    return JSON.parse(decrypted);
};
