/**
 * Which gateway a service's checkout runs on for a corporate, from the admin's payment_methods
 * rows (partner-scoped; pgProvider = operator accessKey). Used by the corporate payment-methods
 * response (what the FE is told) and by the Razorpay create-order (what is enforced).
 */
const paymentMethodUseCase = require("../models/use-cases/paymentMethods");
const { GATEWAY_PROVIDERS, pickProviderCode } = require("../constants/gatewayProviders");

const resolveGatewayProviders = async ({ partnerId, accessKey, rows = null }) => {
  const methods = rows || (await paymentMethodUseCase.findAllPaymentMethodForCorporate({ partnerId, accessKey })) || [];
  return GATEWAY_PROVIDERS.filter(({ pgProvider }) =>
    methods.some((row) => row.paymentMethod === "PAYMENT_GATEWAY" && row.pgProvider === pgProvider)
  );
};

const resolveProviderCode = async ({ partnerId, accessKey, rows = null }) =>
  pickProviderCode(await resolveGatewayProviders({ partnerId, accessKey, rows }), accessKey);

module.exports = { resolveGatewayProviders, resolveProviderCode };
