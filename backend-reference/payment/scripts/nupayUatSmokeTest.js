/**
 * NuPay Collection 360 UAT smoke test — exercises the gateway end-to-end:
 * token -> create collect request -> status enquiry -> statement.
 * Requires the nupay_collections serviceOperator row (run seedNupayVendor.js first).
 *
 * Usage (from payment/): node -r dotenv/config scripts/nupayUatSmokeTest.js
 */
const {
  createCollectRequest,
  getTransactionStatus,
  getTransactionStatement,
} = require("../services/nupayGateway");

const today = new Date().toISOString().slice(0, 10);

const run = async () => {
  console.log("1) Creating collect request (Rs. 1)...");
  const created = await createCollectRequest({
    amount: "1",
    purpose_message: "uat smoke test",
    payer_name: "Test Payer",
    payer_mobile_no: "9876543210",
  });
  console.log(JSON.stringify(created, null, 2));

  console.log(`\n2) Fetching status for ${created.reference_id}...`);
  const status = await getTransactionStatus(created.reference_id);
  console.log(JSON.stringify(status, null, 2));

  console.log(`\n3) Fetching statement for ${today}...`);
  const statement = await getTransactionStatement({
    start_date: today,
    end_date: today,
    offset: 0,
    limit: 10,
  });
  console.log(JSON.stringify(statement, null, 2));

  console.log("\nSmoke test completed.");
  process.exit(0);
};

run().catch((err) => {
  console.error("\nSmoke test failed:", err.message);
  if (err.statusCode) console.error("Status code:", err.statusCode);
  process.exit(1);
});
