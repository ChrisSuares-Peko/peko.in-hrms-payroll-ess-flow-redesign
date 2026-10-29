'use strict';

const SIBLING_SERVICE_DIRS = [
  'api-gateway',
  'corporateCard',
  'kyc',
  'officeAndBusiness',
  'others',
  'payment',
  'paymentGateway',
  'payroll',
  'purchase',
  'scheduler',
  'travel',
  'users',
];

function buildImportNoRestrictedPathsZones(currentDirName) {
  return SIBLING_SERVICE_DIRS.filter((name) => name !== currentDirName).map((name) => ({
    target: './',
    from: `../${name}`,
    message:
      'Cross-service relative imports are forbidden (each service is built and deployed independently in Docker). Use an HTTP call to the other service, a shared npm package, or move/copy the code into this service.',
  }));
}

module.exports = { buildImportNoRestrictedPathsZones, SIBLING_SERVICE_DIRS };
