const asyncHandler = require('./async');
const { findOnboardingByCredential } = require('../models/use-cases/paymentLinkOnboarding');

const verifyPaymentLinkOnboardingCompleted = asyncHandler(async (req, res, next) => {
  const credentialId = req.user?.id;

  if (!credentialId) {
    return res.status(400).json({
      status: false,
      message: 'Credential (user) id missing',
      responseCode: '001',
      data: {},
    });
  }

  const onboardingRecord = await findOnboardingByCredential(credentialId);

  // Only a NuPay-active record counts as onboarded; legacy Decentro records must re-onboard.
  const isNupayActive =
    onboardingRecord &&
    String(onboardingRecord.status || '').toLowerCase() === 'active' &&
    onboardingRecord.vendor === 'nupay';

  if (!isNupayActive) {
    return res.status(403).json({
      status: false,
      message: 'Payment link onboarding is not completed. Please complete onboarding to continue.',
      responseCode: '403',
      data: {
        onboardingCompleted: false,
        onboardingStatus: onboardingRecord?.status || null,
      },
    });
  }

  return next();
});

module.exports = verifyPaymentLinkOnboardingCompleted;
