
const schedule = require("node-schedule");
const { checkSubscriptionValidity } = require('../services/subscriptionValidity');
const { invoiceGuideline } = require("../services/invoiceGuideline");
const { invoicingV2Reminder } = require("../services/invoicingV2Reminder");
const { invoicingV2ReminderRules } = require("../services/invoicingV2ReminderRules");
const { updateInvoicingV2Status } = require("../services/invoicingV2Status");
const { processRecurringInvoices } = require("../services/recurringInvoices");
const { sendHolidayEmails, sendBirthDayMails } = require('../services/holiDay');
const {sendPayrollSlip}=require('../services/salary')
const { sendAnniversaryMails } = require('../services/anniversary');
const { updateSalaryStatus } = require('../services/salary');
const { subscriptionAutoRenewal } = require('../services/subscriptionAutoRenewal');
const { eSignReminders,findESignDocToDelete } = require("../services/eSign");
const { disputeStatus } = require("../services/disputeStatusbbps");
const { bbpsAwaitedStatus } = require("../services/bbpsAwaitedStatus");
const { refreshBillerMDM } = require("../services/refreshBillerMDM");
const { customLog } = require("./loggerHelper");
const { updateAirlineTicketStatus } = require("../services/airline");
const { releaseExpiredFlightHolds } = require("../services/flightHoldRelease");
const { settlePaymentLinks } = require("../services/paymentLinks");
const { syncTunzInventory } = require("../services/tunzSync");
const { runDailyBalanceReminderSweep, runInAppPaymentSweep } = require("../services/corporateCardSweeps");
const { refreshDomainHostingPricingCache } = require("../services/domainHostingPricing");
const { xoxodayTokenRefresh } = require("../services/xoxodayTokenRefresh");
const { autoUpdateXoxodayGiftCards } = require("../services/xoxodayGiftCards");

const { deactivateExpiredSubscriptions, activateDueSubscriptions } = require("../services/corporateSoftwareSubscriptionStatusUpdate");
const { corporateSoftwareSubscriptionAutoRenewal } = require("../services/corporateSoftwareSubscriptionAutoRenewal");
const { pollPrepaidRechargeStatus } = require("../services/prepaidRechargeStatus");
const { sweepCarReportStatus } = require("../services/carReportStatus");
const { triggerSubscriptionCharges } = require("../services/triggerSubscriptionCharges");
const { simulateSubscriptionCharges } = require("../services/simulateSubscriptionCharges");
const { triggerWhatsAppSubscriptionCharges } = require("../services/whatsAppTriggerSubscriptionCharges");
const { triggerEcommerceStoreSubscriptionCharges } = require("../services/ecommerceStoreTriggerSubscriptionCharges");
const { subscriptionGracePeriodRetry } = require("../services/subscriptionGracePeriodRetry");
const { expirePosSubscriptions } = require("../services/posSubscriptionExpiry");
const { clearPayrollDataAfterFreeze } = require("../services/clearPayrollDataAfterFreeze");
const { updateCurrencyExchangRate } = require("../services/currencyExchange");
const { sendVendorWalletReport } = require("../services/vendorWalletReport");

const { triggerOndcOosProductDelete } = require("../services/ondcProductPurge");
const { triggerOndcSellerPayoutSweep } = require("../services/ondcSellerPayout");
const { triggerOndcTatBreachSweep } = require("../services/ondcTatBreach");
const { triggerOndcBuyerDelayNotices } = require("../services/ondcBuyerDelayNotice");
const { triggerOndcDeliveryStatusPoll } = require("../services/ondcDeliveryStatus");
function scheduleCronTasks() {

   // Delete every ONDC product already at qty 0 (all sources), 00:00 IST.
   // Dropped in-stock SKUs are removed by purchase catalog_full snapshot
   // reconcile (on city visit, per domain, 12h). This job only physically
   // removes rows the seller already sent as OOS.
   schedule.scheduleJob({ rule: '0 0 * * *', tz: 'Asia/Kolkata' }, () => {
      customLog(null, "info", { message: "Running ONDC OOS product delete" });
      triggerOndcOosProductDelete();
   });

   // Advance the ONDC seller-payout hold hourly: release the seller's Easy Split share
   // once the return window has closed. Hourly keeps each pass small and caps how long
   // a seller waits past their due time. Delivery polling is the job below — this
   // pass only moves money.
   schedule.scheduleJob('0 * * * *', () => {
      customLog(null, "info", { message: "Running ONDC seller payout sweep" });
      triggerOndcSellerPayoutSweep();
   });

   // Ask the BPPs about orders that should have arrived — nothing tells us an order was
   // delivered unless we ask, and until we do, the payout hold above has nothing to
   // release. Hourly at :30, the same cadence the sweep polled at, offset so the two
   // never overlap. The real limiter is statusPollThrottleHours (6 h) in the candidate
   // query, not this interval, so most passes are cheap no-ops.
   schedule.scheduleJob('30 * * * *', () => {
      customLog(null, "info", { message: "Running ONDC delivery status poll" });
      triggerOndcDeliveryStatusPoll();
   });

   // Alert the internal team about office-supply orders that blew their delivery
   // TAT. Daily, not hourly: the alert is once per order, so a shorter interval
   // would only shave detection latency while adding 23 empty passes. 03:30 sits
   // clear of the hourly payout sweep and the 03:00 holiday/birthday jobs.
   schedule.scheduleJob('30 3 * * *', () => {
      customLog(null, "info", { message: "Running ONDC TAT breach sweep" });
      triggerOndcTatBreachSweep();
   });

   // Apologise to BUYERS whose office-supply orders are past their promised date —
   // the same clock as the internal alert above, aimed at the customer. Daily for
   // the same reason (once per order, so a shorter interval only adds empty passes),
   // at 04:00 so ops see their alert before the buyer gets the email. Independent
   // claims, so neither sweep can silence the other.
   schedule.scheduleJob('0 4 * * *', () => {
      customLog(null, "info", { message: "Running ONDC buyer delay notices" });
      triggerOndcBuyerDelayNotices();
   });
   // cronTaskScheduler()

   // Schedule the job to run every day at 00:01 (one minute past midnight) UTC
   schedule.scheduleJob('1 0 * * *', () => {
      customLog(null, "info", { message: "Running the invoice remainder check" });
      checkSubscriptionValidity();
      invoiceGuideline();
      invoicingV2Reminder();
      invoicingV2ReminderRules();
      updateInvoicingV2Status();
      processRecurringInvoices();
      updateSalaryStatus();
   });

   // Task Scheduled at (scheduled at 3 AM UTC)  
   schedule.scheduleJob('0 3 * * *', () => {
      sendHolidayEmails();
      sendBirthDayMails();
      sendAnniversaryMails();
   });
   // Task Scheduled at (scheduled at 11:59 PM UTC)
   // cron.schedule('59 23 * * *',() => {   
   //     await incrementSalary();
   // });
   //*****************************************************************************************************************

   // Check AWAITED BBPS transactions every 30 minutes and resolve them
   schedule.scheduleJob('*/30 * * * *', () => {
      customLog("SCHEDULER", "info", {
         message: "Running BBPS awaited status check every 30 minutes"
      });
      bbpsAwaitedStatus();
   });
 
   schedule.scheduleJob('0 */6 * * *', async () => {
      try {
        customLog(null, "info", {
          message: "Running disputeStatus scheduler every 6 hours"
        });
    
        await disputeStatus();
    
      } catch (error) {
        customLog(null, "error", {
          message: "disputeStatus scheduler failed",
          error: error.message
        });
      }
    });

   // Running weekly (every Sunday at 12:00 AM)
   schedule.scheduleJob('0 0 * * 0', async () => {
      customLog(null, "info", {
         message: "Running Tunz inventory sync weekly"
      });

      try {
         await syncTunzInventory();
      } catch (error) {
         customLog(null, "error", {
            message: "syncTunzInventory failed",
            error: error.message
         });
      }
   });
       // Check AWAITED BBPS transactions every 30 minutes and resolve them
   schedule.scheduleJob('*/30 * * * *', () => {
      customLog(null, "info", {
         message: "Running BBPS awaited status check every 30 minutes"
      });
      bbpsAwaitedStatus();
   });
   // auto renewal for the subscriptions (scheduled at 12:01 AM )
   schedule.scheduleJob('1 0 * * *', () => {
      subscriptionAutoRenewal();
   });

   // Daily payroll data-clear job (runs in DRY_RUN until the destructive function is uncommented
   // inside services/clearPayrollDataAfterFreeze.js). Identifies corporates whose paid GROUP
   // plan expired more than grace+frozen+payrollDataClear days ago AND who haven't re-subscribed.
   schedule.scheduleJob('5 0 * * *', () => {
      clearPayrollDataAfterFreeze();
   });

   // Schedule the job
   schedule.scheduleJob('1 0 * * *', async () => {
      sendPayrollSlip()
   });

   // Schedule the job to run every day at 00:01 (one minute past midnight) UTC
   schedule.scheduleJob('1 0 * * *', async () => {
      eSignReminders()
      findESignDocToDelete()
   });

   // Airline ticket cancelation status fetch and refund
   schedule.scheduleJob('1 0 * * *', () => {
      customLog(null, "info", { message: "Airline ticket status update" });
      updateAirlineTicketStatus();
   });

   // Hand back non-LCC seats held but never paid for; deadlines are hours, not days.
   schedule.scheduleJob(process.env.FLIGHT_HOLD_SWEEP_CRON || '*/10 * * * *', () => {
      console.log('Flight hold release sweep');
      releaseExpiredFlightHolds();
   });

      // auto renewal for corporate software subscriptions — runs 2 days before expiry (scheduled at 12:01 AM)
   schedule.scheduleJob('1 0 * * *', () => {
      corporateSoftwareSubscriptionAutoRenewal();
   });

   // status cleanup for corporate software subscriptions — expires/cancels  active subscriptions (scheduled at 12:01 AM)
   schedule.scheduleJob('1 0 * * *', () => {
      deactivateExpiredSubscriptions();
      activateDueSubscriptions();
   });

   // Hand back non-LCC seats held but never paid for; deadlines are hours, not days.
   schedule.scheduleJob(process.env.FLIGHT_HOLD_SWEEP_CRON || '*/10 * * * *', () => {
      customLog(null, "info", { message: "Flight hold release sweep" });
      releaseExpiredFlightHolds();
   });

   //payment link settlement
   schedule.scheduleJob("1 0 * * *", () => {
      console.log("Payment Link settlement")
      settlePaymentLinks()
   })
   // Refresh biller MDM data daily at 2 AM UTC
   schedule.scheduleJob('0 2 * * *', () => {
      customLog(null, "info", { message: "Running biller MDM refresh" });
      refreshBillerMDM();
   });

   // Poll JRI for pending prepaid recharge transactions every 30 min
   // Per JRI SRS: call after 15 min if no push URL response, then every 30 min
   schedule.scheduleJob('*/30 * * * *', () => {
      customLog(null, "info", { message: "Running prepaid recharge status poll" });
      pollPrepaidRechargeStatus();
   });

   // Complete BUILDING car reports (valuation PDF poll, Cashfree-leg history) and send
   // the report-ready email — covers orders no page-open or webhook has completed.
   schedule.scheduleJob('*/5 * * * *', () => {
      customLog(null, "info", { message: "Running car report status sweep" });
      sweepCarReportStatus();
   });

   // Xoxoday token refresh — runs daily, refreshes only when due (~13 days after last refresh)
  schedule.scheduleJob('0 2 * * *', () => {
      xoxodayTokenRefresh();
   });

   // schedule.scheduleJob('*/1 * * * *', async () => {
   //    try {
   //       console.log("Testing Tunz sync...");
   //       await syncTunzInventory();
   //    } catch (err) {
   //       console.error(err);
   //    }
   // });

   // Refresh domain & hosting pricing cache every 12 hours (midnight and noon)
   schedule.scheduleJob('0 0,12 * * *', () => {
      refreshDomainHostingPricingCache();
   });

  //  ---------------- update currency exchange rate in db for every 3 hours ------------------
  // Fires at: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
  schedule.scheduleJob("0 */3 * * *", () => {
    updateCurrencyExchangRate();
  });
  //  ------------------------------------------------------------------------------------------


   // Auto-update Xoxoday gift card catalog daily at 12:01 AM
   schedule.scheduleJob('15 16 * * *', () => {
      customLog(null, 'info', { message: 'Running Xoxoday gift cards auto-update' });
      autoUpdateXoxodayGiftCards();
   });

   // Refresh domain & hosting pricing cache every 12 hours (midnight and noon)
   schedule.scheduleJob('0 0,12 * * *', () => {
      customLog(null, "info", { message: "Running domain & hosting pricing cache refresh" });
      refreshDomainHostingPricingCache();
   });

   // Update currency exchange rate in DB every 3 hours
   // Fires at: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
   schedule.scheduleJob("0 */3 * * *", () => {
      updateCurrencyExchangRate();
   });

   // Trigger on-demand Cashfree charges 2 days before each subscription billing date (1 AM UTC)
   schedule.scheduleJob('0 1 * * *', () => {
      customLog(null,"info", { message: "Running subscription charge trigger (2-day pre-billing)" });
      triggerSubscriptionCharges();
      triggerWhatsAppSubscriptionCharges();
      triggerEcommerceStoreSubscriptionCharges();
   });

   // Expire lapsed Peko POS grants (1:30 AM UTC). One-time purchases carry no
   // mandate, so none of the renewal sweeps above would ever reap them.
   schedule.scheduleJob('30 1 * * *', () => {
      customLog(null, "info", { message: "Running Peko POS subscription expiry" });
      expirePosSubscriptions();
   });

   // Retry failed Cashfree subscription charges for grace-period subscriptions (2 AM UTC)
   // Runs after triggerSubscriptionCharges to allow time for webhooks to arrive
   schedule.scheduleJob('0 2 * * *', () => {
      customLog(null,"info", { message: "Running subscription grace period retry" });
      subscriptionGracePeriodRetry();
   });

   // Update currency exchange rate in DB every 3 hours
   // Fires at: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
   schedule.scheduleJob("0 */3 * * *", () => {
      updateCurrencyExchangRate();
   });

   // Staging only: simulate Cashfree CHARGE webhook delivery once daily at midnight.
   // The function itself is hard-gated to NODE_ENV === "staging" and no-ops everywhere else.
   schedule.scheduleJob('0 0 * * *', () => {
      simulateSubscriptionCharges();
   });

   // Daily vendor wallet report at 8 AM IST — emails the configured recipients a table of
   // every vendor's wallet balance (JRI from its API, Bill Avenue from the tracked settings value).
   schedule.scheduleJob('0 8 * * *', () => {
      customLog(null, "info", { message: "Running nightly vendor wallet report" });
      sendVendorWalletReport();
   });

   // Daily corporate cards wallet balance reminder to corporates at 9 AM IST.
   schedule.scheduleJob({ rule: '0 9 * * *', tz: 'Asia/Kolkata' }, () => {
      customLog(null, "info", { message: "Running corporate cards daily wallet balance reminder sweep" });
      runDailyBalanceReminderSweep();
   });

   // Every 5 minutes: close in-app card payments whose redeem never got its answer recorded.
   schedule.scheduleJob('*/5 * * * *', () => {
      runInAppPaymentSweep();
   });
}





module.exports = { scheduleCronTasks };