const { createVirtualAccountV2, sendVendorBankWhitelistEmail } = require("../../../services/paymentLinks");
const { findPrimary: findPrimaryBankAccount } = require('../../../models/use-cases/bankAccount');
const { createOtp, verifyOtp } = require("../../../models/use-cases/otp");
const { sendSMS } = require("../../../utils/sms");
const {
  asyncHandler,
  findOnboardingByCredential,
  customLog,
  saveStep1,
  savePanStep,
  saveBankStep,
  saveStep2AndActivate,
  findOneWithCredentialId,
  ErrorResponse,
  fs,
  puppeteer,
  BANK_DETAILS_FALLBACKS,
  BANK_TRANSFER_METHODS,
  verifyPan,
  verifyBankAccount,
  getBankDetailsPdfTemplate,
} = require("./common");

const normalizeCredentialPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  const normalized = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(normalized) ? normalized : null;
};

const getCredentialPhone = async (credentialId) => {
  const corporateUser = await findOneWithCredentialId(credentialId);
  return normalizeCredentialPhone(corporateUser?.mobileNo || corporateUser?.dataValues?.mobileNo);
};

const getCredentialProfileContext = async (credentialId) => {
  const [corporateUser, primaryBank] = await Promise.all([
    findOneWithCredentialId(credentialId),
    findPrimaryBankAccount(credentialId),
  ]);
  const dv = corporateUser?.dataValues || corporateUser || {};
  const credentialDv = dv.credential?.dataValues || dv.credential || {};
  const bankDv = primaryBank?.dataValues || primaryBank || null;
  return {
    phone: normalizeCredentialPhone(dv.mobileNo),
    profileCompanyName:
      dv.companyName || dv.name || credentialDv.name || credentialDv.username || null,
    profilePan: dv.panNumber ? String(dv.panNumber).toUpperCase() : null,
    profilePanVerified: Boolean(dv.panVerified),
    profileBankName: bankDv?.bankName || null,
    profileAccountNumber: bankDv?.accountNumber || null,
    profileIfsc: bankDv?.ifscCode || null,
  };
};

const getRequiredCredentialPhone = async (credentialId) => {
  const phone = await getCredentialPhone(credentialId);
  if (!phone) {
    throw new ErrorResponse("Valid registered mobile number is required to continue onboarding", 400);
  }
  return phone;
};

const toPlainOnboardingRecord = (record) => {
  if (!record) return null;
  if (typeof record.toJSON === "function") return record.toJSON();
  return { ...record };
};

const withProfileContext = (record, ctx) => {
  const plainRecord = toPlainOnboardingRecord(record) || {};
  return {
    ...plainRecord,
    phone: ctx?.phone || null,
    savedBankPhone: normalizeCredentialPhone(plainRecord?.phone) || null,
    profileCompanyName: ctx?.profileCompanyName || null,
    profilePan: ctx?.profilePan || null,
    profilePanVerified: !!ctx?.profilePanVerified,
    profileBankName: ctx?.profileBankName || null,
    profileAccountNumber: ctx?.profileAccountNumber || null,
    profileIfsc: ctx?.profileIfsc || null,
  };
};

exports.getOnboardingProfileContext = asyncHandler(async (req, res) => {
  const ctx = await getCredentialProfileContext(req.user.id);
  return res.status(200).json({
    status: true,
    message: "Profile context fetched successfully",
    responseCode: "000",
    data: ctx,
  });
});

exports.getOnboardingStatus = asyncHandler(async (req, res) => {
  const [record, ctx] = await Promise.all([
    findOnboardingByCredential(req.user.id),
    getCredentialProfileContext(req.user.id),
  ]);

  return res.status(200).json({
    status: true,
    message: "Onboarding status fetched successfully",
    responseCode: "000",
    data: withProfileContext(record, ctx),
  });
});

exports.exportBankDetailsPdf = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const { type } = req.params;
  if (type !== "pdf") {
    return res.status(400).json({
      status: false,
      message: "Unsupported export type. Only pdf is supported.",
      responseCode: "001",
      data: {},
    });
  }

  const record = await findOnboardingByCredential(corporateUser);
  const bankDetails = [
    {
      label: "Account Name",
      value: record?.businessName || BANK_DETAILS_FALLBACKS.accountName,
    },
    {
      label: "Account Number",
      value:
        record?.virtualAccountNumber ||
        record?.accountNumber ||
        BANK_DETAILS_FALLBACKS.accountNumber,
    },
    {
      label: "IFSC Code",
      value: record?.virtualIfsc || record?.ifsc || BANK_DETAILS_FALLBACKS.ifscCode,
    },
    { label: "Branch", value: BANK_DETAILS_FALLBACKS.branch },
  ];

  const reportHtmlWithStyle = getBankDetailsPdfTemplate({
    bankDetails,
    transferMethods: BANK_TRANSFER_METHODS,
  });

  let browser = null;
  let outputFile = "";

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

    outputFile = `bank-details-${Date.now()}.pdf`;
    await page.pdf({
      path: outputFile,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const buffer = fs.readFileSync(outputFile);

    return res.status(200).json({
      status: true,
      message: "Bank details PDF generated successfully",
      data: {
        buffer,
        fileType: "application/pdf",
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error in exportBankDetailsPdf", error: error?.message });
    return next(new ErrorResponse("Something went wrong while generating report", 500));
  } finally {
    if (browser) {
      await browser.close();
    }
    if (outputFile && fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  }
});

exports.saveOnboardingStep1 = asyncHandler(async (req, res) => {
  const { businessName, bankName, accountNumber, ifsc } = req.body;
  const result = await verifyBankAccount({
    bank_account:accountNumber,
    ifsc:ifsc
  })
  const bankNameFromIfsc = result.response?.ifsc_details?.bank || null;

  function stripBank(str) {
    return str ? str.replace(/bank/gi, '').trim().toLowerCase() : '';
  }

  const match =
    !!bankNameFromIfsc &&
    stripBank(bankNameFromIfsc) === stripBank(bankName);

  if (!match) {
    return res.status(400).json({
      status: false,
      message: "Bank name and IFSC do not match",
      responseCode: "001",
      data: {
        match,
        bankNameFromIfsc,
      },
    });
  }
  const record = await saveStep1({
    credentialId: req.user.id,
    businessName: businessName.trim(),
    bankName: bankName || null,
    accountNumber: accountNumber || null,
    ifsc: ifsc ? ifsc.toUpperCase() : null,
  });
  const ctx = await getCredentialProfileContext(req.user.id);

  return res.status(200).json({
    status: true,
    message: "Step 1 saved successfully",
    responseCode: "000",
    data: withProfileContext(record, ctx),
  });
});

exports.verifyBankNameAndIfsc = asyncHandler(async (req, res) => {
  const { bankName, accountNumber, ifsc } = req.body;

  const result = await verifyBankAccount({
    bank_account: accountNumber,
    ifsc: ifsc.toUpperCase(),
  });

  const bankNameFromIfsc = result.response?.ifsc_details?.bank || null;

  function stripBank(str) {
    return str ? str.replace(/bank/gi, '').trim().toLowerCase() : '';
  }

  const match =
    !!bankNameFromIfsc &&
    stripBank(bankNameFromIfsc) === stripBank(bankName);

  if (!match) {
    return res.status(400).json({
      status: false,
      message: "Bank name and IFSC do not match",
      responseCode: "001",
      data: {
        match,
        bankNameFromIfsc,
      },
    });
  }

  return res.status(200).json({
    status: true,
    message: "Bank name and IFSC match",
    responseCode: "000",
    data: {
      match,
      bankNameFromIfsc,
    },
  });
});

exports.saveOnboardingPanStep = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;

  const { pan } = req.body;
  const ctx = await getCredentialProfileContext(credentialId);
  const submittedPan = String(pan || "").trim().toUpperCase();
  const matchesVerifiedProfilePan =
    ctx.profilePanVerified && ctx.profilePan && submittedPan === ctx.profilePan;

  let panHolderName = null;
  if (matchesVerifiedProfilePan) {
    panHolderName = ctx.profileCompanyName || null;
  } else {
    const panResult = await verifyPan(submittedPan);
    if (!panResult?.valid) {
      return res.status(400).json({
        status: false,
        message: "Please enter a valid pan",
        responseCode: "001",
        data: {},
      });
    }
    panHolderName = panResult.name || null;
  }

  const updated = await savePanStep({
    credentialId,
    pan: submittedPan,
    businessName: panHolderName,
  });

  return res.status(200).json({
    status: true,
    message: "PAN verified and saved successfully",
    responseCode: "000",
    data: withProfileContext(updated, ctx),
  });
});

exports.sendPhoneOtp = asyncHandler(async (req, res) => {
  const phone = normalizeCredentialPhone(req.body.phone);
  if (!phone) {
    return res.status(400).json({
      status: false,
      message: "Invalid phone number",
      responseCode: "001",
      data: {},
    });
  }

  const otp = await createOtp({ contact: phone });
  if (!otp) {
    return res.status(500).json({
      status: false,
      message: "Could not generate OTP. Please try again.",
      responseCode: "999",
      data: {},
    });
  }

  await sendSMS(`+91${phone}`, `Your Peko verification OTP is ${otp}. Valid for 2 minutes.`);

  return res.status(200).json({
    status: true,
    message: "OTP sent",
    responseCode: "000",
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
  });
});

exports.verifyPhoneOtp = asyncHandler(async (req, res) => {
  const phone = normalizeCredentialPhone(req.body.phone);
  const { otp } = req.body;
  if (!phone) {
    return res.status(400).json({
      status: false,
      message: "Invalid phone number",
      responseCode: "001",
      data: {},
    });
  }

  const result = await verifyOtp({ contact: phone, otp });
  if (!result?.isVerified) {
    return res.status(400).json({
      status: false,
      message: result?.message || "Invalid OTP",
      responseCode: "OTP_INVALID",
      data: {},
    });
  }

  return res.status(200).json({
    status: true,
    message: "OTP verified",
    responseCode: "000",
    data: {},
  });
});

exports.saveOnboardingBankStep = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;

  const record = await findOnboardingByCredential(credentialId);
  if (!record) {
    return res.status(400).json({
      status: false,
      message: "Onboarding record not found. Complete Step 1 first.",
      responseCode: "001",
      data: {},
    });
  }

  const { accountNumber, ifsc, bankName, name, phone, phoneOtp } = req.body;

  const trimmedAccountNumber = accountNumber.trim();
  const normalizedIfsc = ifsc.trim().toUpperCase();
  const trimmedName = name.trim();
  const submittedPhone = normalizeCredentialPhone(phone);

  if (submittedPhone) {
    const profilePhone = await getCredentialPhone(credentialId);
    const recordPhone = normalizeCredentialPhone(record.phone);
    const isTrustedPhone =
      submittedPhone === profilePhone || submittedPhone === recordPhone;

    if (!isTrustedPhone) {
      if (!phoneOtp) {
        return res.status(400).json({
          status: false,
          message: "OTP verification required for this phone number",
          responseCode: "OTP_REQUIRED",
          data: {},
        });
      }
      const verify = await verifyOtp({ contact: submittedPhone, otp: phoneOtp });
      if (!verify?.isVerified) {
        return res.status(400).json({
          status: false,
          message: verify?.message || "Invalid OTP",
          responseCode: "OTP_INVALID",
          data: {},
        });
      }
    }
  }

  const credentialPhone = submittedPhone || (await getRequiredCredentialPhone(credentialId));

  const verificationResult = await verifyBankAccount({
    bank_account: trimmedAccountNumber,
    ifsc: normalizedIfsc,
    name: trimmedName,
    phone: credentialPhone,
  });
  if (!verificationResult?.status || !verificationResult?.valid) {
    return res.status(400).json({
      status: false,
      message:
        verificationResult?.message ||
        "Unable to verify bank account details. Please check the account details and try again.",
      responseCode: "001",
      data: {},
    });
  }

  const updated = await saveBankStep({
    credentialId,
    accountNumber: trimmedAccountNumber,
    ifsc: normalizedIfsc,
    bankName:
      verificationResult?.response?.bank_name ||
      (bankName ? bankName.trim() : record.bankName || undefined),
    accountHolderName: trimmedName,
    phone: credentialPhone,
    bankVerificationResponse: verificationResult.response || {},
  });
  const ctx = await getCredentialProfileContext(credentialId);

  return res.status(200).json({
    status: true,
    message: "Bank account verified and saved successfully",
    responseCode: "000",
    data: withProfileContext(updated, { ...ctx, phone: credentialPhone }),
  });
});

exports.saveOnboardingStep2 = asyncHandler(async (req, res, next) => {
  try{

    const record = await findOnboardingByCredential(req.user.id);
    if (!record?.businessName) {
      return next(new ErrorResponse("Please complete PAN step first", 400));
    }
  
    const credentialPhone =
      normalizeCredentialPhone(record.phone) || (await getRequiredCredentialPhone(req.user.id));
  
    // v2 VA — skip if already created
    let v2AccountNumber = record.virtualAccountNumber || null;
    let v2Ifsc = record.virtualIfsc || null;
    if (!v2AccountNumber) {
      const v2Result = await createVirtualAccountV2({
        customer_id: req.user.id + "",
        name: record.businessName,
        mobile: credentialPhone,
        pan: record.pan,
      });
      v2AccountNumber = v2Result?.data?.account_details?.[0]?.virtual_account_number;
      v2Ifsc = v2Result?.data?.account_details?.[0]?.virtual_account_ifsc;
    }
  
    const data = await saveStep2AndActivate({
      credentialId: req.user.id,
      virtualAccountNumber: v2AccountNumber,
      virtualIfsc: v2Ifsc,
      phone: credentialPhone,
      activeStatus:"approval-pending"
    });
    await sendVendorBankWhitelistEmail({
      virtualAccountNumber: v2AccountNumber,
      accountNumber: record.accountNumber,
      ifsc: record.ifsc,
      accountHolderName: record.accountHolderName,
      bankName: record.bankName,
    });
    const ctx = await getCredentialProfileContext(req.user.id);
    return res.status(200).json({
      status: true,
      message: "Payment collections activated successfully",
      responseCode: "000",
      data: withProfileContext(data, { ...ctx, phone: credentialPhone }),
    });
  }catch(err){
    customLog(req?.LogTraceId, "error", { message: "Error in saveOnboardingStep2", error: err });
    return next(err);
  }
});
