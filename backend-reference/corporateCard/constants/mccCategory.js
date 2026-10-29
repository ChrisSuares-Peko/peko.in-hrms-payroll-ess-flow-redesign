const MCC_CATEGORY_MAP = {
    5411: 'Groceries',
    5412: 'Groceries',
    5541: 'Fuel',
    5542: 'Fuel',
    5812: 'Food & Dining',
    5813: 'Food & Dining',
    5814: 'Food & Dining',
    4111: 'Travel',
    4511: 'Travel',
    7011: 'Travel',
    4899: 'Utilities & Subscriptions',
    4900: 'Utilities & Subscriptions',
    5045: 'Office Supplies & Equipment',
    5734: 'Software & Technology',
    5044: 'Office Supplies & Equipment',
    5921: 'Office Supplies & Equipment',
    8062: 'Healthcare',
    8011: 'Healthcare',
    7399: 'Professional Services',
}

const DEFAULT_CATEGORY = 'Other'

const categoryForMcc = (mcc) => MCC_CATEGORY_MAP[Number(mcc)] || DEFAULT_CATEGORY

module.exports = { MCC_CATEGORY_MAP, DEFAULT_CATEGORY, categoryForMcc }
