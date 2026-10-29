// Daily "Vendor Wallet Report" email — a single table of every vendor's wallet balance.
// Each vendor balance is fetched live from its own vendor API (mirroring the corporate balance-check
// flow in the owning service), except Bill Avenue which has no balance API and is read from the
// internally-tracked settings value. Recipients are read from the pekoWebsite setting.
//   - JRI (Mobile Recharge & Bills): vendor /api/Balance.
//   - Bill Avenue (Utility Payments): internally-tracked settings value (no vendor API).
//   - TBO (Flights / Hotels): Authenticate -> GetAgencyBalance (CashBalance).
//   - Shiprocket (Logistics): auth/login -> account/details/wallet-balance.
//   - Xoxoday (Gift Cards / Vouchers): plumProAPI getBalance.
// Each fetch fails soft (returns null -> shown as "N/A") so one unreachable vendor never blocks the mail.
// Adding another vendor is one more fetch + one more entry in the `vendors` list below.

const axios = require("axios");

const emailer = require("../utils/emailer");
const { customLog } = require("../utils/loggerHelper");
const { getASetting } = require("../models/use-cases/setting");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { formatNumberWithLocalString } = require("../utils/formatter");
const withRetry = require("../utils/withRetry");
const { xoxodayAccessToken } = require("./xoxodayGiftCards");
const operatorsData = require("../utils/operatorsData.json");

const EMAIL_SETTING_KEY = "pekoWebsite";
const BILLAVENUE_SETTING_KEY = "billAvenueWalletBalance";
const JRI_ACCESS_KEY = operatorsData.prepaid.accessKey;
const AIRLINE_ACCESS_KEY = operatorsData.flight.accessKey;
const HOTEL_ACCESS_KEY = operatorsData.hotel.accessKey;
const LOGISTICS_ACCESS_KEY = operatorsData.logistics.accessKey;
const XOXODAY_ACCESS_KEY = operatorsData.xoxoday.accessKey;

const VENDOR_TIMEOUT = 60000;
const VENDOR_REQUEST_ATTEMPTS = 3;

const vendorRequest = (vendorLabel, config) =>
    withRetry(async () => {
        try {
            return await axios(config);
        } catch (error) {
            customLog(null, "info", { message: "vendorWalletReport: vendor request attempt failed", action: "vendorWalletReport:vendor:attemptFailed", vendor: vendorLabel, status: error && error.response && error.response.status, code: error && error.code, error: error && error.message }, "VENDOR");
            throw error;
        }
    }, VENDOR_REQUEST_ATTEMPTS);

// Resolve a service operator's vendor config by access key. Returns the vendor object or null.
// Fails soft so a lookup error for one vendor never rejects the whole report.
const getVendor = async (accessKey) => {
    try {
        const operator = await findServiceOperatorByAccessKey(accessKey);
        if (!operator || operator.error || !operator.vendor) {
            customLog(null, "error", { message: "vendorWalletReport: vendor unresolved — showing N/A", action: "vendorWalletReport:vendor:unresolved", accessKey, hasOperator: !!operator, operatorError: operator && operator.error, hasVendor: !!(operator && operator.vendor) }, "VENDOR");
            return null;
        }
        return operator.vendor;
    } catch (error) {
        customLog(null, "error", { message: "vendorWalletReport: service operator lookup failed", accessKey, error: error && error.message }, "VENDOR");
        return null;
    }
};

// JRI mobile-recharge wallet balance from the vendor balance API. Returns a number or null.
const fetchJriBalance = async () => {
    try {
        if (process.env.NODE_ENV === "staging") return 1000; // vendor balance API is mocked in staging
        const vendor = await getVendor(JRI_ACCESS_KEY);
        if (!vendor || !vendor.apiUrl) return null;
        const resp = await vendorRequest("JRI", {
            method: "post",
            url: `${vendor.apiUrl}/api/Balance`,
            headers: { "Content-Type": "application/json" },
            data: { CorporateNumber: vendor.optional3, Password: vendor.optional2 },
            timeout: VENDOR_TIMEOUT,
        });
        const balance = parseFloat(resp && resp.data && resp.data.Balance);
        return Number.isFinite(balance) ? balance : null;
    } catch (error) {
        customLog(null, "error", { message: "vendorWalletReport: JRI balance fetch failed", error: (error && error.response && error.response.data) || (error && error.message), code: error && error.code }, "VENDOR");
        return null;
    }
};

// Bill Avenue wallet balance from the internally-tracked setting. Returns a number or null.
// Fails soft (like every other vendor fetch) so a settings lookup error shows "N/A" and never blocks the mail.
const fetchBillAvenueBalance = async () => {
    try {
        let details = await getASetting(BILLAVENUE_SETTING_KEY);
        if (typeof details === "string") {
            try {
                details = JSON.parse(details);
            } catch (parseError) {
                // details was a non-JSON string; leave as-is so the guard below treats it as unset
            }
        }
        const balance = details && details.balance;
        customLog(null, "info", { message: "vendorWalletReport: Bill Avenue balance read", action: "vendorWalletReport:billavenue:read", settingKey: BILLAVENUE_SETTING_KEY, settingPresent: details != null, detailsType: typeof details, detailsKeys: details && typeof details === "object" ? Object.keys(details) : null, rawBalance: balance ?? null }, "VENDOR");
        return balance === undefined || balance === null ? null : Number(balance);
    } catch (error) {
        customLog(null, "error", { message: "vendorWalletReport: Bill Avenue balance fetch failed", error: error && error.message }, "VENDOR");
        return null;
    }
};

// TBO agency cash balance — shared by Flights and Hotels (both use the TBO Authenticate +
// GetAgencyBalance APIs, differing only in base URL and credential mapping). Returns a number or null.
const fetchTboAgencyBalance = async ({ baseUrl, clientId, userName, password, endUserIp, label }) => {
    try {
        if (!baseUrl || !clientId || !userName || !password) return null;
        const authResp = await vendorRequest(label, {
            method: "post",
            url: `${baseUrl}/Authenticate`,
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            data: JSON.stringify({ ClientId: clientId, UserName: userName, Password: password, EndUserIp: endUserIp }),
            timeout: VENDOR_TIMEOUT,
        });
        const tokenId = authResp && authResp.data && authResp.data.TokenId;
        const member = (authResp && authResp.data && authResp.data.Member) || {};
        if (!tokenId || !member.MemberId || !member.AgencyId) {
            customLog(null, "error", { message: `vendorWalletReport: ${label} authentication failed`, vendorError: authResp && authResp.data && authResp.data.Error }, "VENDOR");
            return null;
        }
        const balResp = await vendorRequest(label, {
            method: "post",
            url: `${baseUrl}/GetAgencyBalance`,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ ClientId: clientId, TokenAgencyId: member.AgencyId, TokenMemberId: member.MemberId, EndUserIp: endUserIp, TokenId: tokenId }),
            timeout: VENDOR_TIMEOUT,
        });
        const balance = parseFloat(balResp && balResp.data && balResp.data.CashBalance);
        return Number.isFinite(balance) ? balance : null;
    } catch (error) {
        customLog(null, "error", { message: `vendorWalletReport: ${label} balance fetch failed`, error: (error && error.response && error.response.data) || (error && error.message), code: error && error.code }, "VENDOR");
        return null;
    }
};

// TBO airline agency balance — auth + balance hang off vendor.healthUrl/rest. Returns a number or null.
const fetchAirlineBalance = async () => {
    const vendor = await getVendor(AIRLINE_ACCESS_KEY);
    if (!vendor || !vendor.healthUrl) return null;
    return fetchTboAgencyBalance({
        baseUrl: `${vendor.healthUrl}/rest`,
        clientId: vendor.optional3,
        userName: vendor.optional1,
        password: vendor.optional2,
        endUserIp: vendor.optional4,
        label: "Flights (TBO)",
    });
};

// TBO hotel agency balance — auth URL + end-user IP live under vendor.optionals. Returns a number or null.
const fetchHotelBalance = async () => {
    const vendor = await getVendor(HOTEL_ACCESS_KEY);
    const authUrl = vendor && vendor.optionals && vendor.optionals.hotelsAuth;
    if (!vendor || !authUrl) return null;
    return fetchTboAgencyBalance({
        baseUrl: authUrl,
        clientId: vendor.optional3,
        userName: vendor.optional1,
        password: vendor.optional2,
        endUserIp: vendor.optionals.endUserIp,
        label: "Hotels (TBO)",
    });
};

// Shiprocket logistics wallet balance — login for a bearer token, then read wallet-balance. Returns a number or null.
const fetchShiprocketBalance = async () => {
    try {
        const vendor = await getVendor(LOGISTICS_ACCESS_KEY);
        if (!vendor || !vendor.apiUrl) return null;
        const apiUrl = vendor.apiUrl;
        const loginResp = await vendorRequest("Shiprocket", {
            method: "post",
            url: `${apiUrl}/v1/external/auth/login`,
            headers: { "Content-Type": "application/json" },
            data: { email: vendor.optional2, password: vendor.optional1 },
            timeout: VENDOR_TIMEOUT,
        });
        const token = loginResp && loginResp.data && loginResp.data.token;
        if (!token) {
            customLog(null, "error", { message: "vendorWalletReport: Shiprocket authentication failed" }, "VENDOR");
            return null;
        }
        const balResp = await vendorRequest("Shiprocket", {
            method: "get",
            url: `${apiUrl}/v1/external/account/details/wallet-balance`,
            headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
            timeout: VENDOR_TIMEOUT,
        });
        const balance = Number(balResp && balResp.data && balResp.data.data && balResp.data.data.balance_amount);
        return Number.isFinite(balance) ? balance : null;
    } catch (error) {
        customLog(null, "error", { message: "vendorWalletReport: Shiprocket balance fetch failed", error: (error && error.response && error.response.data) || (error && error.message), code: error && error.code }, "VENDOR");
        return null;
    }
};

// Xoxoday gift-card wallet balance — reuse the service's token lifecycle, then plumProAPI getBalance. Returns a number or null.
const fetchXoxodayBalance = async () => {
    try {
        const vendor = await getVendor(XOXODAY_ACCESS_KEY);
        const baseUrl = vendor && (vendor.apiUrl || vendor.healthUrl);
        if (!vendor || !baseUrl) return null;
        const accessToken = await xoxodayAccessToken(vendor, XOXODAY_ACCESS_KEY);
        if (!accessToken) {
            customLog(null, "error", { message: "vendorWalletReport: Xoxoday access token unavailable" }, "VENDOR");
            return null;
        }
        const resp = await vendorRequest("Xoxoday", {
            method: "post",
            url: `${baseUrl}/api`,
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            data: { query: "plumProAPI.query.getBalance", tag: "plumProAPI", variables: { data: {} } },
            timeout: VENDOR_TIMEOUT,
        });
        const balanceData = resp && resp.data && resp.data.data && resp.data.data.getBalance;
        if (!balanceData || balanceData.status !== 1) {
            customLog(null, "error", { message: "vendorWalletReport: Xoxoday getBalance failed", response: resp && resp.data }, "VENDOR");
            return null;
        }
        const balance = parseFloat(balanceData.data && balanceData.data.value);
        return Number.isFinite(balance) ? balance : null;
    } catch (error) {
        customLog(null, "error", { message: "vendorWalletReport: Xoxoday balance fetch failed", error: (error && error.response && error.response.data) || (error && error.message), code: error && error.code }, "VENDOR");
        return null;
    }
};

const formatBalance = (value) => (value == null ? "N/A" : `&#8377;${formatNumberWithLocalString(value)}`);

exports.sendVendorWalletReport = async () => {
    try {
        const emailSetting = await getASetting(EMAIL_SETTING_KEY);
        const recipients = emailSetting && emailSetting.emails;
        if (!recipients || !recipients.length) {
            customLog(null, "error", { message: "vendorWalletReport skipped — no recipient emails configured (pekoWebsite.details.emails)" });
            return;
        }

        // allSettled (not all): one vendor fetch that rejects must never abort the batch — the report still
        // goes out with "N/A" for that vendor. Each fetch already fails soft to null; this is the structural
        // backstop so a future vendor added without its own try/catch still can't block the scheduled mail.
        const settled = await Promise.allSettled([
            fetchJriBalance(),
            fetchBillAvenueBalance(),
            fetchAirlineBalance(),
            fetchHotelBalance(),
            fetchShiprocketBalance(),
            fetchXoxodayBalance(),
        ]);
        const vendorLabels = ["JRI", "Bill Avenue", "Flights (TBO)", "Hotels (TBO)", "Shiprocket", "Xoxoday"];
        const [jriBalance, billAvenueBalance, airlineBalance, hotelBalance, shiprocketBalance, xoxodayBalance] =
            settled.map((result, i) => {
                if (result.status === "fulfilled") return result.value;
                customLog(null, "error", { message: "vendorWalletReport: vendor balance fetch rejected — showing N/A", vendor: vendorLabels[i], error: result.reason && result.reason.message }, "VENDOR");
                return null;
            });

        // One row per vendor — add a vendor by appending here.
        const vendors = [
            { serviceName: "Mobile Recharge & Bills", vendor: "JRI", balance: jriBalance },
            { serviceName: "Utility Payments", vendor: "Bill Avenue", balance: billAvenueBalance },
            { serviceName: "Flights", vendor: "TBO", balance: airlineBalance },
            { serviceName: "Hotels", vendor: "TBO", balance: hotelBalance },
            { serviceName: "Logistics", vendor: "Shiprocket", balance: shiprocketBalance },
            { serviceName: "Gift Cards / Vouchers", vendor: "Xoxoday", balance: xoxodayBalance },
        ];

        const cell = "padding:8px 12px;border:1px solid #e0e0e0;text-align:left;";
        const rows = vendors
            .map(
                (v, i) =>
                    `<tr>
                        <td style="${cell}">${i + 1}</td>
                        <td style="${cell}">${v.serviceName}</td>
                        <td style="${cell}">${v.vendor}</td>
                        <td style="${cell}">${formatBalance(v.balance)}</td>
                    </tr>`
            )
            .join("");

        const body = `<p>Dear Admin,</p>
            <p>Please find below the vendors wallet balance status.</p>
            <table style="border-collapse:collapse;border:1px solid #e0e0e0;font-family:Arial,sans-serif;font-size:14px;">
                <thead>
                    <tr style="background:#f4f6fa;">
                        <th style="${cell}">Sr. No.</th>
                        <th style="${cell}">Service Name</th>
                        <th style="${cell}">Vendor</th>
                        <th style="${cell}">Current Wallet Balance</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p>For any enquiry or further assistance, reach out to us at reach@peko.one.</p>
            <p>Best Regards,<br/>Team Peko</p>`;

        emailer.email(recipients, "[Internal] Daily Vendor Wallet Report", body, () => {});
        customLog(null, "info", { message: "Vendor wallet report sent", jriBalance, billAvenueBalance, airlineBalance, hotelBalance, shiprocketBalance, xoxodayBalance, recipientCount: recipients.length, recipients });
    } catch (error) {
        customLog(null, "error", { message: "sendVendorWalletReport failed", error: error && error.message });
    }
};
