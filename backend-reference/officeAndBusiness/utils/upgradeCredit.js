const moment = require('moment');

// Prorates unused days on the current subscription against what was paid for it: its frozen subscriptionPrice less its discount.
exports.computeUpgradeCredit = (currentSubscription) => {
  if (!currentSubscription) return 0;
  const { subscriptionStartDate, subscriptionEndDate, subscriptionPrice, discount } = currentSubscription;
  const price = Math.max(0, Number(subscriptionPrice || 0) - Number(discount || 0));
  if (!subscriptionStartDate || !subscriptionEndDate || !price) return 0;

  const start = moment(subscriptionStartDate);
  const end = moment(subscriptionEndDate);
  const totalDays = end.diff(start, 'days');
  const remainingDays = end.diff(moment(), 'days') - 1;
  if (totalDays <= 0 || remainingDays <= 0) return 0;

  const dailyRate = price / totalDays;
  return Math.max(0, Math.floor(dailyRate * remainingDays));
};
