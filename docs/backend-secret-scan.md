# Backend reference secret scan

PROTOTYPE-SETUP: secret scan of `backend-reference/` (excluding node_modules) before the first push. Values were never printed. `.env*` files were deleted; private-key files were replaced with `REDACTED`; secret values in config/code were replaced with `"REDACTED"` keeping the key. A rescan after redaction found 0 matches.

| File | Line | Finding |
|---|---|---|
| `AWS-API-GATEWAY.yml` | 47 | literal for key "awsCredentials" |
| `AWS-OFFICEBUSINESS-MS-CI-CD.yml` | 47 | literal for key "awsCredentials" |
| `AWS-OTHERS-MS-CI-CD.yml` | 47 | literal for key "awsCredentials" |
| `AWS-USERS-MS-CI-CD.yml` | 47 | literal for key "awsCredentials" |
| `api-gateway/.env.local` | - | env-file (deleted) |
| `api-gateway/.env.production` | - | env-file (deleted) |
| `api-gateway/.env.staging` | - | env-file (deleted) |
| `api-gateway/openapi.yaml` | 124 | yaml literal for key "password" |
| `api-gateway/openapi.yaml` | 153 | yaml literal for key "password" |
| `api-gateway/openapi.yaml` | 226 | jwt |
| `corporateCard/.env.local` | - | env-file (deleted) |
| `corporateCard/.env.staging` | - | env-file (deleted) |
| `corporateCard/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `corporateCard/configs/firebase-private.json` | 5 | json key $.private_key |
| `corporateCard/constants/corporateAgreementEsign.js` | 3 | literal for key "ESIGN_ACCESS_KEY" |
| `corporateCard/controllers/webhook/__tests__/esignStatus.test.js` | 24 | literal for key "ESIGN_CALLBACK_SECRET" |
| `corporateCard/scripts/convertCardholdersToEmployees.js` | 10 | literal for key "password" |
| `corporateCard/scripts/convertCardholdersToEmployees.js` | 19 | literal for key "password" |
| `corporateCard/src/app.js` | 59 | literal for key "secret" |
| `kyc/.env.production` | - | env-file (deleted) |
| `kyc/.env.staging` | - | env-file (deleted) |
| `kyc/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `kyc/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `kyc/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `kyc/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `kyc/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `kyc/configs/firebase-private.json` | 5 | json key $.private_key |
| `kyc/configs/giftCard.json` | 6 | json key $.staging.password |
| `kyc/configs/giftCard.json` | 6 | json key $.local.password |
| `kyc/configs/giftCard.json` | 6 | json key $.production.password |
| `kyc/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `kyc/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `kyc/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `kyc/configs/giftCard.json` | 9 | json key $.staging.token |
| `kyc/configs/giftCard.json` | 9 | json key $.local.token |
| `kyc/configs/giftCard.json` | 9 | json key $.production.token |
| `kyc/models/use-cases/__tests__/credential/credential.test.js` | 21 | literal for key "password" |
| `kyc/models/use-cases/__tests__/signUp/signUp.test.js` | 154 | literal for key "totpSecret" |
| `kyc/models/use-cases/__tests__/signUp/signUp.test.js` | 171 | literal for key "totpSecret" |
| `kyc/models/use-cases/__tests__/systemUser/systemUser.test.js` | 22 | literal for key "resetPasswordToken" |
| `kyc/utils/loggerHelper.js` | 36 | literal for key "password" |
| `kyc/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `kyc/utils/pusherConfig.js` | 4 | literal for key "secret" |
| `officeAndBusiness/.env.local` | - | env-file (deleted) |
| `officeAndBusiness/.env.production` | - | env-file (deleted) |
| `officeAndBusiness/.env.staging` | - | env-file (deleted) |
| `officeAndBusiness/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `officeAndBusiness/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `officeAndBusiness/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `officeAndBusiness/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `officeAndBusiness/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `officeAndBusiness/configs/firebase-private.json` | 5 | json key $.private_key |
| `officeAndBusiness/configs/giftCard.json` | 6 | json key $.staging.password |
| `officeAndBusiness/configs/giftCard.json` | 6 | json key $.local.password |
| `officeAndBusiness/configs/giftCard.json` | 6 | json key $.production.password |
| `officeAndBusiness/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `officeAndBusiness/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `officeAndBusiness/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `officeAndBusiness/configs/giftCard.json` | 9 | json key $.staging.token |
| `officeAndBusiness/configs/giftCard.json` | 9 | json key $.local.token |
| `officeAndBusiness/configs/giftCard.json` | 9 | json key $.production.token |
| `officeAndBusiness/controllers/corporate/corporateCardESign.js` | 17 | literal for key "ESIGN_ACCESS_KEY" |
| `officeAndBusiness/controllers/corporate/eSign.js` | 8 | literal for key "accessKey" |
| `officeAndBusiness/controllers/corporate/eSignWebhook.js` | 11 | literal for key "accessKey" |
| `officeAndBusiness/controllers/corporate/payment_gateway.js` | 14 | literal for key "accessKey" |
| `officeAndBusiness/controllers/corporate/quikLinks.js` | 232 | literal for key "AuthKey" |
| `officeAndBusiness/controllers/corporate/quikLinks.js` | 35 | literal for key "AuthKey" |
| `officeAndBusiness/controllers/corporate/whatsAppForBusiness.js` | 41 | literal for key "accessKey" |
| `officeAndBusiness/models/use-cases/__tests__/signUp/authVerification.test.js` | 45 | literal for key "totpSecret" |
| `officeAndBusiness/models/use-cases/__tests__/signUp/authVerification.test.js` | 59 | literal for key "totpSecret" |
| `officeAndBusiness/services/eSign.js` | 713 | literal for key "serviceAccessKey" |
| `officeAndBusiness/utils/__tests__/pekoEcomClient.test.js` | 24 | literal for key "secret" |
| `officeAndBusiness/utils/__tests__/pekoEcomClient.test.js` | 39 | literal for key "secret" |
| `officeAndBusiness/utils/constants.js` | 3 | literal for key "PASSWORD_GEN_DIGIT_CHARS" |
| `officeAndBusiness/utils/loggerHelper.js` | 36 | literal for key "password" |
| `officeAndBusiness/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `officeAndBusiness/utils/operatorsData.json` | 3 | json key $.eSign.accessKey |
| `officeAndBusiness/utils/operatorsData.json` | 3 | json key $.whatsAppForBusiness.accessKey |
| `officeAndBusiness/utils/pusher.js` | 6 | literal for key "secret" |
| `others/.env.production` | - | env-file (deleted) |
| `others/.env.staging` | - | env-file (deleted) |
| `others/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `others/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `others/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `others/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `others/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `others/configs/firebase-private.json` | 5 | json key $.private_key |
| `others/configs/giftCard.json` | 6 | json key $.staging.password |
| `others/configs/giftCard.json` | 6 | json key $.local.password |
| `others/configs/giftCard.json` | 6 | json key $.production.password |
| `others/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `others/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `others/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `others/configs/giftCard.json` | 9 | json key $.staging.token |
| `others/configs/giftCard.json` | 9 | json key $.local.token |
| `others/configs/giftCard.json` | 9 | json key $.production.token |
| `others/controllers/admin/passwordPolicy.js` | 85 | literal for key "customBannedPasswords" |
| `others/models/use-cases/__tests__/accountingDashboard/alerts.test.js` | 319 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/accountingDashboard/alerts.test.js` | 335 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/accountingDashboard/alerts.test.js` | 336 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/accountingDashboard/alerts.test.js` | 337 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/bankDetails/findDefaultBankAccount.test.js` | 14 | literal for key "mockCredentialId" |
| `others/models/use-cases/__tests__/bankDetails/findDefaultBankAccount.test.js` | 39 | literal for key "mockCredentialId" |
| `others/models/use-cases/__tests__/bankDetails/findDefaultBankAccount.test.js` | 58 | literal for key "mockCredentialId" |
| `others/models/use-cases/__tests__/beneficiary/createBeneficiary.test.js` | 113 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/createBeneficiary.test.js` | 24 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/createBeneficiary.test.js` | 48 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/createBeneficiary.test.js` | 65 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/createBeneficiary.test.js` | 83 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/fetchBeneficiaries.test.js` | 20 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/fetchBeneficiaries.test.js` | 61 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/beneficiary/fetchBeneficiaries.test.js` | 77 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/configAuditLog.test.js` | 98 | literal for key "password" |
| `others/models/use-cases/__tests__/credential/changePassword.test.js` | 15 | literal for key "oldPassword" |
| `others/models/use-cases/__tests__/credential/changePassword.test.js` | 15 | literal for key "newPassword" |
| `others/models/use-cases/__tests__/credential/changePassword.test.js` | 30 | literal for key "oldPassword" |
| `others/models/use-cases/__tests__/credential/changePassword.test.js` | 30 | literal for key "newPassword" |
| `others/models/use-cases/__tests__/credential/changePassword.test.js` | 43 | literal for key "oldPassword" |
| `others/models/use-cases/__tests__/credential/changePassword.test.js` | 43 | literal for key "newPassword" |
| `others/models/use-cases/__tests__/journalConfigurationGate.test.js` | 12 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/oauthClients/updateOauthClient.test.js` | 75 | literal for key "client_secret" |
| `others/models/use-cases/__tests__/serviceApprovals/readiness.test.js` | 319 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/serviceApprovals/readiness.test.js` | 322 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/serviceApprovals/readiness.test.js` | 325 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/serviceConfiguration.test.js` | 66 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/subscriptionAddOns.test.js` | 153 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/subscriptionAddOns.test.js` | 18 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/subscriptionAddOns.test.js` | 44 | literal for key "accessKey" |
| `others/models/use-cases/__tests__/systemUser/createPartner.test.js` | 49 | literal for key "password" |
| `others/models/use-cases/__tests__/systemUser/createPartner.test.js` | 59 | literal for key "resetPasswordToken" |
| `others/models/use-cases/__tests__/systemUser/createResendMail.test.js` | 102 | literal for key "resetPasswordToken" |
| `others/models/use-cases/__tests__/systemUser/createResendMail.test.js` | 44 | literal for key "resetPasswordToken" |
| `others/models/use-cases/__tests__/transaction/findAllFaildBulkTransactions.test.js` | 15 | literal for key "serviceAccessKey" |
| `others/models/use-cases/__tests__/transaction/transactionReports.test.js` | 29 | literal for key "resetToken" |
| `others/models/use-cases/__tests__/transaction/transactionReports.test.js` | 30 | literal for key "resetPasswordToken" |
| `others/utils/emailTemplateKeys.js` | 40 | literal for key "SET_NEW_PASSWORD" |
| `others/utils/emailTemplateKeys.js` | 47 | literal for key "PROFILE_RESET_PASSWORD_SUCCESS" |
| `others/utils/loggerHelper.js` | 38 | literal for key "password" |
| `others/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `others/utils/operatorsData.json` | 3 | json key $.creditCard.accessKey |
| `others/utils/operatorsData.json` | 3 | json key $.loanRepayment.accessKey |
| `others/utils/operatorsData.json` | 3 | json key $.municipalServices.accessKey |
| `others/utils/operatorsData.json` | 3 | json key $.municipalTaxes.accessKey |
| `others/utils/operatorsData.json` | 3 | json key $.housingSociety.accessKey |
| `others/utils/operatorsData.json` | 3 | json key $.prepaidMeter.accessKey |
| `others/utils/passwordPolicy.js` | 165 | literal for key "customBannedPasswords" |
| `others/utils/passwordPolicy.js` | 21 | literal for key "customBannedPasswords" |
| `others/utils/passwordPolicy.js` | 84 | literal for key "customBannedPasswords" |
| `others/utils/pusherConfig.js` | 4 | literal for key "secret" |
| `payment/.env.production` | - | env-file (deleted) |
| `payment/.env.staging` | - | env-file (deleted) |
| `payment/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `payment/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `payment/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `payment/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `payment/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `payment/configs/firebase-private.json` | 5 | json key $.private_key |
| `payment/configs/giftCard.json` | 6 | json key $.staging.password |
| `payment/configs/giftCard.json` | 6 | json key $.local.password |
| `payment/configs/giftCard.json` | 6 | json key $.production.password |
| `payment/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `payment/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `payment/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `payment/configs/giftCard.json` | 9 | json key $.staging.token |
| `payment/configs/giftCard.json` | 9 | json key $.local.token |
| `payment/configs/giftCard.json` | 9 | json key $.production.token |
| `payment/configs/serviceAccountKey.json` | 4 | json key $.private_key_id |
| `payment/configs/serviceAccountKey.json` | 5 | json key $.private_key |
| `payment/controllers/corporate/commonBillHandler.js` | 34 | literal for key "CREDIT_CARD_ACCESS_KEY" |
| `payment/controllers/corporate/telecomPayments/__tests__/prepaid.payment.journal.test.js` | 101 | literal for key "accessKey" |
| `payment/migrations/20260724000001-add-nupay-merchant-credentials-to-paymentLinkOnboarding.js` | 9 | literal for key "nupayAccessSecret" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 100 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 19 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 22 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 35 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 47 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 49 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 62 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 73 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/serviceOperator/findOne.test.js` | 86 | literal for key "accessKey" |
| `payment/models/use-cases/__tests__/signUp/authVerification.test.js` | 122 | literal for key "totpSecret" |
| `payment/models/use-cases/__tests__/signUp/authVerification.test.js` | 49 | literal for key "totpSecret" |
| `payment/models/use-cases/__tests__/signUp/authVerification.test.js` | 72 | literal for key "totpSecret" |
| `payment/models/use-cases/__tests__/signUp/authVerification.test.js` | 94 | literal for key "totpSecret" |
| `payment/public/assets/js/airlineNames.js` | 17523 | literal for key "PWD" |
| `payment/public/assets/js/airlineNames.js` | 7651 | literal for key "PWD" |
| `payment/public/assets/js/editor/ckeditor/ckeditor.js` | 19343 | literal for key "accessKey" |
| `payment/public/assets/js/form-builder/form-builder-2/beautifyhtml.js` | 96 | literal for key "single_token" |
| `payment/public/assets/js/page-builder/ckeditor.js` | 17689 | literal for key "accessKey" |
| `payment/utils/decentroGateway.js` | 81 | literal for key "client_secret" |
| `payment/utils/loggerHelper.js` | 36 | literal for key "password" |
| `payment/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `payment/utils/operatorsData.json` | 3 | json key $.creditCard.accessKey |
| `payment/utils/operatorsData.json` | 3 | json key $.loanRepayment.accessKey |
| `payment/utils/operatorsData.json` | 3 | json key $.municipalServices.accessKey |
| `payment/utils/operatorsData.json` | 3 | json key $.municipalTaxes.accessKey |
| `payment/utils/operatorsData.json` | 3 | json key $.housingSociety.accessKey |
| `payment/utils/operatorsData.json` | 3 | json key $.prepaidMeter.accessKey |
| `payment/utils/pusherConfig.js` | 4 | literal for key "secret" |
| `paymentGateway/.env.production` | - | env-file (deleted) |
| `paymentGateway/.env.staging` | - | env-file (deleted) |
| `paymentGateway/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `paymentGateway/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `paymentGateway/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `paymentGateway/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `paymentGateway/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `paymentGateway/configs/firebase-private.json` | 5 | json key $.private_key |
| `paymentGateway/configs/giftCard.json` | 6 | json key $.staging.password |
| `paymentGateway/configs/giftCard.json` | 6 | json key $.local.password |
| `paymentGateway/configs/giftCard.json` | 6 | json key $.production.password |
| `paymentGateway/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `paymentGateway/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `paymentGateway/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `paymentGateway/configs/giftCard.json` | 9 | json key $.staging.token |
| `paymentGateway/configs/giftCard.json` | 9 | json key $.local.token |
| `paymentGateway/configs/giftCard.json` | 9 | json key $.production.token |
| `paymentGateway/configs/serviceAccountKey.json` | 4 | json key $.private_key_id |
| `paymentGateway/configs/serviceAccountKey.json` | 5 | json key $.private_key |
| `paymentGateway/controllers/admin/payment_gateway.js` | 21 | literal for key "accessKey" |
| `paymentGateway/controllers/corporate/__tests__/cashfreeMerchantResolution.test.js` | 23 | literal for key "paymentclientsecret" |
| `paymentGateway/controllers/corporate/__tests__/cashfreeMerchantResolution.test.js` | 35 | literal for key "paymentclientsecret" |
| `paymentGateway/controllers/corporate/__tests__/cashfreeMerchantResolution.test.js` | 42 | literal for key "clientSecret" |
| `paymentGateway/controllers/corporate/__tests__/cashfreeMerchantResolution.test.js` | 52 | literal for key "clientSecret" |
| `paymentGateway/controllers/corporate/__tests__/cashfreeMerchantResolution.test.js` | 60 | literal for key "clientSecret" |
| `paymentGateway/controllers/corporate/__tests__/cashfreeMerchantResolution.test.js` | 72 | literal for key "clientSecret" |
| `paymentGateway/controllers/corporate/payment_gateway.js` | 5 | literal for key "accessKey" |
| `paymentGateway/controllers/corporate/whatsAppForBusiness.js` | 45 | literal for key "accessKey" |
| `paymentGateway/models/use-cases/__tests__/signup/authVerification.test.js` | 23 | literal for key "mockTotpSecret" |
| `paymentGateway/models/use-cases/__tests__/signup/authVerification.test.js` | 39 | literal for key "mockTotpSecret" |
| `paymentGateway/utils/__tests__/billPayments_utils/getBillerByBillerID.test.js` | 26 | literal for key "ENCRYPTION_KEY" |
| `paymentGateway/utils/__tests__/gatewayProviderMswipe.test.js` | 65 | literal for key "paymentclientsecret" |
| `paymentGateway/utils/__tests__/gatewayProviders.test.js` | 70 | literal for key "accessKey" |
| `paymentGateway/utils/__tests__/gatewayProviders.test.js` | 76 | literal for key "accessKey" |
| `paymentGateway/utils/__tests__/pekoEcomClient.test.js` | 24 | literal for key "secret" |
| `paymentGateway/utils/__tests__/redisConnection.test.js` | 25 | literal for key "REDIS_PASSWORD" |
| `paymentGateway/utils/__tests__/redisConnection.test.js` | 45 | literal for key "REDIS_PASSWORD" |
| `paymentGateway/utils/airlineData.js` | 17518 | literal for key "PWD" |
| `paymentGateway/utils/airlineData.js` | 7648 | literal for key "PWD" |
| `paymentGateway/utils/loggerHelper.js` | 36 | literal for key "password" |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.creditCard.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.loanRepayment.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.municipalServices.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.municipalTaxes.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.housingSociety.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.prepaidMeter.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.whatsAppForBusiness.accessKey |
| `paymentGateway/utils/operatorsData.json` | 3 | json key $.eSign.accessKey |
| `paymentGateway/utils/pusherConfig.js` | 4 | literal for key "secret" |
| `paymentGateway/utils/pusherNotification.js` | 12 | literal for key "secret" |
| `payroll/.env.production` | - | env-file (deleted) |
| `payroll/.env.staging` | - | env-file (deleted) |
| `payroll/src/configs/database/server.pem` | 1 | private-key file (content replaced) |
| `payroll/src/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `payroll/src/configs/firebase-private.json` | 5 | json key $.private_key |
| `payroll/src/services/getWpsAuthToken.js` | 16 | literal for key "client_secret" |
| `payroll/src/services/getWpsAuthToken.js` | 19 | literal for key "password" |
| `payroll/src/services/getWpsAuthToken2.js` | 20 | literal for key "client_secret" |
| `payroll/src/services/getWpsAuthToken2.js` | 23 | literal for key "password" |
| `payroll/src/utils/loggerHelper.js` | 36 | literal for key "password" |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.creditCard.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.loanRepayment.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.municipalServices.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.municipalTaxes.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.housingSociety.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.prepaidMeter.accessKey |
| `payroll/src/utils/operatorsData.json` | 3 | json key $.flight.accessKey |
| `purchase/.env.production` | - | env-file (deleted) |
| `purchase/.env.staging` | - | env-file (deleted) |
| `purchase/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `purchase/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `purchase/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `purchase/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `purchase/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `purchase/configs/firebase-private.json` | 5 | json key $.private_key |
| `purchase/configs/giftCard.json` | 6 | json key $.staging.password |
| `purchase/configs/giftCard.json` | 6 | json key $.local.password |
| `purchase/configs/giftCard.json` | 6 | json key $.production.password |
| `purchase/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `purchase/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `purchase/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `purchase/configs/giftCard.json` | 9 | json key $.staging.token |
| `purchase/configs/giftCard.json` | 9 | json key $.local.token |
| `purchase/configs/giftCard.json` | 9 | json key $.production.token |
| `purchase/controllers/corporate/payment_gateway.js` | 7 | literal for key "accessKey" |
| `purchase/utils/__tests__/easySplit.test.js` | 39 | literal for key "clientSecret" |
| `purchase/utils/loggerHelper.js` | 36 | literal for key "password" |
| `purchase/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `purchase/utils/pusherConfig.js` | 4 | literal for key "secret" |
| `scheduler/.env.production` | - | env-file (deleted) |
| `scheduler/.env.staging` | - | env-file (deleted) |
| `scheduler/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `scheduler/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `scheduler/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `scheduler/configs/firebase-private.json` | 5 | json key $.private_key |
| `scheduler/models/use-cases/__tests__/transaction/transaction.test.js` | 119 | literal for key "credentialName" |
| `scheduler/models/use-cases/__tests__/transaction/transaction.test.js` | 152 | literal for key "credentialName" |
| `scheduler/models/use-cases/__tests__/transaction/transaction.test.js` | 93 | literal for key "credentialName" |
| `scheduler/utils/__tests__/easySplitSettlement.test.js` | 31 | literal for key "clientSecret" |
| `scheduler/utils/decentroGateway.js` | 82 | literal for key "client_secret" |
| `scheduler/utils/loggerHelper.js` | 36 | literal for key "password" |
| `scheduler/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `scheduler/utils/operatorsData.json` | 3 | json key $.domainHosting.accessKey |
| `scheduler/utils/operatorsData.json` | 3 | json key $.niPaymentGateway.accessKey |
| `scheduler/utils/operatorsData.json` | 3 | json key $.whatsAppForBusiness.accessKey |
| `sharedServices/.env.staging` | - | env-file (deleted) |
| `sharedServices/utils/loggerHelper.js` | 36 | literal for key "password" |
| `travel/.env.production` | - | env-file (deleted) |
| `travel/.env.staging` | - | env-file (deleted) |
| `travel/configs/airline.json` | 4 | json key $.staging.PASSWORD |
| `travel/configs/airline.json` | 4 | json key $.production.PASSWORD |
| `travel/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `travel/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `travel/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `travel/configs/firebase-private.json` | 5 | json key $.private_key |
| `travel/configs/giftCard.json` | 6 | json key $.staging.password |
| `travel/configs/giftCard.json` | 6 | json key $.local.password |
| `travel/configs/giftCard.json` | 6 | json key $.production.password |
| `travel/configs/giftCard.json` | 7 | json key $.staging.clientSecret |
| `travel/configs/giftCard.json` | 7 | json key $.local.clientSecret |
| `travel/configs/giftCard.json` | 7 | json key $.production.clientSecret |
| `travel/configs/giftCard.json` | 9 | json key $.staging.token |
| `travel/configs/giftCard.json` | 9 | json key $.local.token |
| `travel/configs/giftCard.json` | 9 | json key $.production.token |
| `travel/configs/serviceAccountKey.json` | 4 | json key $.private_key_id |
| `travel/configs/serviceAccountKey.json` | 5 | json key $.private_key |
| `travel/configs/serviceAccountKey.uat.json` | 4 | json key $.private_key_id |
| `travel/configs/serviceAccountKey.uat.json` | 5 | json key $.private_key |
| `travel/controllers/corporate/flight.js` | 20 | literal for key "accessKey" |
| `travel/models/use-cases/notification.js` | 8 | literal for key "secret" |
| `travel/utils/__tests__/emailer.test.js` | 20 | literal for key "SENDGRID_API_KEY" |
| `travel/utils/airlineData.js` | 17521 | literal for key "PWD" |
| `travel/utils/airlineData.js` | 7650 | literal for key "PWD" |
| `travel/utils/loggerHelper.js` | 36 | literal for key "password" |
| `travel/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `users/.env.production` | - | env-file (deleted) |
| `users/.env.staging` | - | env-file (deleted) |
| `users/configs/api_configs.json` | 10 | json key $.SMS_API.PASSWORD |
| `users/configs/api_configs.json` | 10 | json key $.RML_SMS_API.PASSWORD |
| `users/configs/firebase-private.json` | 4 | json key $.private_key_id |
| `users/configs/firebase-private.json` | 5 | json key $.private_key |
| `users/configs/serviceAccountKey.json` | 4 | json key $.private_key_id |
| `users/configs/serviceAccountKey.json` | 5 | json key $.private_key |
| `users/controllers/__tests__/cardMember.test.js` | 260 | literal for key "password" |
| `users/controllers/__tests__/essEmployeeRehire.test.js` | 55 | literal for key "password" |
| `users/controllers/admin/signUp.js` | 1016 | literal for key "secretKey" |
| `users/controllers/admin/signUp.js` | 1061 | literal for key "secretKey" |
| `users/controllers/admin/signUp.js` | 917 | literal for key "customBannedPasswords" |
| `users/controllers/passwordPolicy.js` | 75 | literal for key "customBannedPasswords" |
| `users/keys/rsa.key` | 1 | private-key file (content replaced) |
| `users/middlewares/__tests__/loggerMiddleware.test.js` | 26 | literal for key "password" |
| `users/models/use-cases/__tests__/credential/findOneCredentialWithUsername.test.js` | 15 | literal for key "passwordProtection" |
| `users/models/use-cases/__tests__/signUp/Update.test.js` | 108 | literal for key "password" |
| `users/models/use-cases/__tests__/signUp/Update.test.js` | 42 | literal for key "password" |
| `users/models/use-cases/__tests__/signUp/Update.test.js` | 68 | literal for key "password" |
| `users/models/use-cases/__tests__/signUp/findUsername.test.js` | 19 | literal for key "password" |
| `users/models/use-cases/__tests__/subCorporateUser/checkDeletedUserExits.test.js` | 21 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/checkDeletedUserExits.test.js` | 23 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/checkDeletedUserExits.test.js` | 44 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/checkDeletedUserExits.test.js` | 66 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/createSubCorporate.test.js` | 168 | literal for key "resetPasswordToken" |
| `users/models/use-cases/__tests__/subCorporateUser/createSubCorporate.test.js` | 44 | literal for key "resetPasswordToken" |
| `users/models/use-cases/__tests__/subCorporateUser/linkMemberIdentity.test.js` | 29 | literal for key "password" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 115 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 122 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 150 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 159 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 167 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 168 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 23 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 30 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 58 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/subCorporateUser/restoreSubCorporate.test.js` | 86 | literal for key "corporateCredentialID" |
| `users/models/use-cases/__tests__/systemUser/create.test.js` | 43 | literal for key "resetPasswordToken" |
| `users/routes/API/v1/__tests__/idp.test.js` | 127 | literal for key "client_secret" |
| `users/routes/API/v1/__tests__/idp.test.js` | 131 | literal for key "client_secret" |
| `users/routes/API/v1/__tests__/idp.test.js` | 56 | literal for key "client_secret" |
| `users/routes/API/v1/forgot-password.js` | 645 | literal for key "passwordSetOrChanged" |
| `users/routes/API/v1/idp.js` | 357 | literal for key "token_client_secret_mismatch" |
| `users/utils/__tests__/apiValidation.signUp.test.js` | 37 | literal for key "password" |
| `users/utils/__tests__/approvalGate.structure.test.js` | 14 | literal for key "accessKey" |
| `users/utils/emailTemplateKeys.js` | 23 | literal for key "RESET_PASSWORD" |
| `users/utils/emailTemplateKeys.js` | 24 | literal for key "RESET_PASSWORD_SUCCESS" |
| `users/utils/emailTemplateKeys.js` | 25 | literal for key "SET_PASSWORD" |
| `users/utils/emailTemplateKeys.js` | 26 | literal for key "SET_NEW_PASSWORD" |
| `users/utils/loggerHelper.js` | 36 | literal for key "password" |
| `users/utils/operatorsData.json` | 3 | json key $.prepaid.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.creditCard.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.loanRepayment.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.municipalTaxes.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.municipalServices.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.prepaidMeter.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.housingSociety.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.eSign.accessKey |
| `users/utils/operatorsData.json` | 3 | json key $.whatsAppBusiness.accessKey |
| `users/utils/passwordPolicy.js` | 104 | literal for key "customBannedPasswords" |
| `users/utils/passwordPolicy.js` | 179 | literal for key "customBannedPasswords" |
| `users/utils/passwordPolicy.js` | 23 | literal for key "customBannedPasswords" |
| `users/utils/pusherConfig.js` | 11 | literal for key "secret" |
| `users/utils/pusherConfig.js` | 4 | literal for key "secret" |
| `backend-reference/<svc>/configs/keys.json` (kyc, officeAndBusiness, others, payment, paymentGateway, purchase, scheduler, travel, users) | 2 | jwtSecret (literal value was skipped by the first pass as a placeholder word; redacted in the history rewrite) |
