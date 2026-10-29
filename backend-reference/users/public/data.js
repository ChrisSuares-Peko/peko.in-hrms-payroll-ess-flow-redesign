const companyActivity = 
[
  { value: "General Trading", label: "General Trading" },
  { value: "Information Technology", label: "Information Technology" },
  { value: "Consulting Services", label: "Consulting Services" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Healthcare Services", label: "Healthcare Services" },
  { value: "Retail", label: "Retail" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Hospitality", label: "Hospitality" },
  { value: "Transportation", label: "Transportation" },
  { value: "Education", label: "Education" },
  { value: "Media and Entertainment", label: "Media and Entertainment" },
  { value: "Food and Beverage", label: "Food and Beverage" },
  { value: "Construction", label: "Construction" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Energy and Utilities", label: "Energy and Utilities" },
  { value: "Automotive", label: "Automotive" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Legal Services", label: "Legal Services" },
  { value: "Other", label: "Other" }
]

const reportSubscription = [
  { value: "all", label: "All" },
  // { value: "ACCOUNTING-SUBSCRIPTION", label: "Accounting" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "SUBSCRIPTION-ADDONS", label: "Subscription Addons" },
  { value: "WHATSAPP-SUBSCRIPTION", label: "Whatsapp" },
]

const supportModules = [
  { value: 'Signup', label: 'Signup' },
  { value: 'Signin', label: 'Signin' },
  { value: 'Profile', label: 'Profile' },
  { value: 'Bank Accounts', label: 'Bank Accounts' },
  { value: 'Address', label: 'Address' },
  { value: 'Telecom Payments', label: 'Telecom Payments' },
  { value: 'Utility Payments', label: 'Utility Payments' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'Softwares', label: 'Softwares' },
  { value: 'Gift Card/Vouchers', label: 'Gift Card/Vouchers' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'Peko Connect', label: 'Peko Connect' },
  { value: 'Invoicing', label: 'Invoicing' },
];


const companySize = [
  { value: '1-10', label: '1-10' },
  { value: '11-30', label: '11-30' },
  { value: '31-75', label: '31-75' },
  { value: '76-100', label: '76-100' },
  { value: '100 & Above', label: '100 & Above' }
]

const addressType = [
  { value: 'Office', label: 'Office' },
  { value: 'Home', label: 'Home' }
]

const months = [
  { value: 'all', label: 'All' },
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'May' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sept' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const paymentMode = [
  { value: 'all', label: 'All' },
  // { value: 'WALLET', label: 'Wallet' },
  { value: 'PAYMENT GATEWAY', label: 'Payment Gateway' },
  // { value: 'PAYMENT GATEWAY + WALLET', label: 'Payment Gateway + Wallet' },
];

const reportCategory = [
  { value: "all", label: "All" },
  { value: "Payroll", label: "Payroll" },
  { value: "Telecom Payments", label: "Telecom Payments" },
  { value: "Travel", label: "Travel" },
  { value: "Utility Payments", label: "Utility Payments" },
  { value: "Other Services", label: "Other Services" },
  // { value: "Office Supplies", label: "Office Supplies" },
  // { value: "Softwares", label: "Softwares" },
  { value: "Shipment Services", label: "Logistics" },
  { value: "Gift Cards/Vouchers", label: "Gift Cards/Vouchers" },
  // { value: "Vendor Payout", label: "Vendor Payout" },
  // { value: "Tax Payments", label: "Tax Payments" },
  // { value: "Collect", label: "The Collector" },
  // { value: "Insurance", label: "Insurance" },
  // { value: "Document Attestation", label: "Document Attestation" },
  // { value: "Office Address", label: "Office Address" },
  // { value: "zeroCarbon", label: "Zero Carbon" },
  // { value: "Hike", label: "Hike"},
  // { value: "Business Emails", label: "Business Emails" },
  // { value: "Others", label: "Others"}
];


// Get the current year
const currentYear = new Date().getFullYear();

// Generate an array of years going back 10 years
const year = Array.from({ length: 11 }, (_, index) => currentYear - index);

// Create the final array with the 'All' object at the beginning
const years = [
  { value: 'all', label: 'All' },
  ...year.map(year => ({ value: year.toString(), label: year.toString() }))
];

const circleList = [
  { value: 'ALL', label: 'All' },
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'ASM', label: 'Assam' },
  { value: 'BIH', label: 'Bihar & Jharkhand' },
  { value: 'CHE', label: 'Chennai' },
  { value: 'DEL', label: 'Delhi' },
  { value: 'GUJ', label: 'Gujarat' },
  { value: 'HAR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JK', label: 'J&K' },
  { value: 'KK', label: 'Karnataka' },
  { value: 'KER', label: 'Kerala' },
  { value: 'KOL', label: 'Kolkata' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MAH', label: 'Maharashtra' },
  { value: 'MUM', label: 'Mumbai' },
  { value: 'NE', label: 'NorthEast' },
  { value: 'ORI', label: 'Orissa' },
  { value: 'PUN', label: 'Punjab' },
  { value: 'RAJ', label: 'Rajasthan' },
  { value: 'TN', label: 'Tamilnadu' },
  { value: 'UPE', label: 'Uttar Pradesh (East)' },
  { value: 'UPW', label: 'Uttar Pradesh (West)' },
  { value: 'WB', label: 'WestBengal & AN Island' },
];

const typeOfBill = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'postpaid', label: 'Postpaid' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'lpg', label: 'LPG Cylinder' },
  { value: 'water', label: 'Water' },
  { value: 'broadband', label: 'Broadband' },
  { value: 'landline', label: 'Landline' },
  { value: 'pipedgas', label: 'Piped Gas' },
  { value: 'schoolfee', label: 'Education Fee' }
];

const disputeReasons = [
  { value: 'account-not-updated', label: 'Account Not Updated' },
  { value: 'double-payment', label: 'Double Payment' },
  { value: 'paid-to-wrong-account', label: 'Paid to Wrong Account' },
  { value: 'amount-deducted-biller-credited-no-transaction-id', label: 'Amount Deducted, Biller Credited, No Transaction ID' },
  { value: 'amount-deducted-biller-not-credited-no-transaction-id', label: 'Amount Deducted, Biller Not Credited, No Transaction ID' },
  { value: 'amount-deducted-multiple-times', label: 'Amount Deducted Multiple Times' },
  { value: 'others', label: 'Others' }
];

const issueTypes = [
  { value: 'Order Queries', label: 'Order Queries' },
  { value: 'Refund Queries', label: 'Refund Queries' },
  { value: 'Cashback Queries', label: 'Cashback Queries' },
  { value: 'Shipment Queries', label: 'Shipment Queries' },
  { value: 'Portal Related Queries', label: 'Portal Related Queries' },
  { value: 'Other Queries', label: 'Other Queries' }
];

const supportIssueType = [
  { value: 'Payment Related Queries', label: 'Payment Related Queries' },
  { value: 'Order Queries', label: 'Order Queries' },
  { value: 'Billing Queries', label: 'Billing Queries' },
  { value: 'Refund Queries', label: 'Refund Queries' },
  { value: 'Cashback Queries', label: 'Cashback Queries' },
  { value: 'Shipment Queries', label: 'Shipment Queries' },
  { value: 'Portal Related Queries', label: 'Portal Related Queries' },
  { value: 'Other Queries', label: 'Other Queries' },
];

const bankAccountType = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' }
]

const deviceType = [
  { value: 'WEB', label: 'Web' },
  { value: 'MOBILE', label: 'Mobile' }
]

const kycType = [
  { value: 'pending', label: 'PENDING' },
  { value: 'underReview', label: 'UNDER REVIEW' },
  { value: 'rejected', label: 'REJECTED' },
  { value: 'approved', label: 'APPROVED' }
]

const indianStates = [
  { "label": "Andhra Pradesh", "value": "Andhra Pradesh" },
  { "label": "Arunachal Pradesh", "value": "Arunachal Pradesh" },
  { "label": "Assam", "value": "Assam" },
  { "label": "Bihar", "value": "Bihar" },
  { "label": "Chhattisgarh", "value": "Chhattisgarh" },
  { "label": "Goa", "value": "Goa" },
  { "label": "Gujarat", "value": "Gujarat" },
  { "label": "Haryana", "value": "Haryana" },
  { "label": "Himachal Pradesh", "value": "Himachal Pradesh" },
  { "label": "Jharkhand", "value": "Jharkhand" },
  { "label": "Karnataka", "value": "Karnataka" },
  { "label": "Kerala", "value": "Kerala" },
  { "label": "Madhya Pradesh", "value": "Madhya Pradesh" },
  { "label": "Maharashtra", "value": "Maharashtra" },
  { "label": "Manipur", "value": "Manipur" },
  { "label": "Meghalaya", "value": "Meghalaya" },
  { "label": "Mizoram", "value": "Mizoram" },
  { "label": "Nagaland", "value": "Nagaland" },
  { "label": "Odisha", "value": "Odisha" },
  { "label": "Punjab", "value": "Punjab" },
  { "label": "Rajasthan", "value": "Rajasthan" },
  { "label": "Sikkim", "value": "Sikkim" },
  { "label": "Tamil Nadu", "value": "Tamil Nadu" },
  { "label": "Telangana", "value": "Telangana" },
  { "label": "Tripura", "value": "Tripura" },
  { "label": "Uttar Pradesh", "value": "Uttar Pradesh" },
  { "label": "Uttarakhand", "value": "Uttarakhand" },
  { "label": "West Bengal", "value": "West Bengal" },
  // Union Territories
  { "label": "Andaman and Nicobar Islands", "value": "Andaman and Nicobar Islands" },
  { "label": "Chandigarh", "value": "Chandigarh" },
  { "label": "Dadra and Nagar Haveli and Daman and Diu", "value": "Dadra and Nagar Haveli and Daman and Diu" },
  { "label": "Lakshadweep", "value": "Lakshadweep" },
  { "label": "Delhi", "value": "Delhi" },
  { "label": "Puducherry", "value": "Puducherry" },
  { "label": "Jammu and Kashmir", "value": "Jammu and Kashmir" },
  { "label": "Ladakh", "value": "Ladakh" }
]

const connectCategory = [
  { value: 'Set-up', label: 'Set-up' },
  { value: 'IT', label: 'IT' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Finance', label: 'Finance' },
  { value: 'PRO', label: 'PRO' },
  { value: 'HR', label: 'HR' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Other', label: 'Other' }
];

const serviceType = [
  { value: "Telecom Payments", label: "Telecom Payments" },
  { value: "Utility Payments", label: "Utility Payments" },
  { value: "Other Services", label: "Other Services" },
  { value: "Insurances", label: "Insurances" },
  { value: "Softwares", label: "Softwares" },
  { value: "Vendor Payout", label: "Vendor Payout" },
  { value: "Document Attestation", label: "Document Attestation" },
  { value: "Travel", label: "Travel" },
  { value: "Payroll", label: "Payroll" },
  { value: "Insurance", label: "Insurance" },
  { value: "Gift Cards/Vouchers", label: "Gift Cards/Vouchers" },
  { value: "Shipment Services", label: "Shipment Services" },
  { value: "Collect", label: "Collect" },
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "zeroCarbon", label: "Zero Carbon" },
  { value: "Tax Payments", label: "Tax Payments" },
  { value: "Office Address", label: "Office Address" },
  { value: "BNPL", label: "BNPL" },
  { value: "Business Emails", label: "Business Emails" },
  { value: "Corporate Cards", label: "Corporate Cards" },
  { value: "Payment Gateway", label: "Payment Gateway" },
  { value: "Other", label: "Other" }
];

const AttestationCountryData = [
  { value: "IN", label: "India" },
  { value: "US", label: "USA" },
  { value: "AE", label: "UAE" },
  { value: "GB", label: "UK" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "CN", label: "China" },
  { value: "PH", label: "Philippines" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "SG", label: "Singapore" },
  { value: "CH", label: "Switzerland" },
  { value: "BH", label: "Bahrain" },
  { value: "FR", label: "France" },
  { value: "EG", label: "Egypt" },
  { value: "NP", label: "Nepal" },
  { value: "LB", label: "Lebanon" },
  { value: "TR", label: "Turkey" },
  { value: "PK", label: "Pakistan" },
];

const gstStates = [
  { label: 'Jammu and Kashmir', value: '01' },
  { label: 'Himachal Pradesh', value: '02' },
  { label: 'Punjab', value: '03' },
  { label: 'Chandigarh', value: '04' },
  { label: 'Uttarakhand', value: '05' },
  { label: 'Haryana', value: '06' },
  { label: 'Delhi', value: '07' },
  { label: 'Rajasthan', value: '08' },
  { label: 'Uttar Pradesh', value: '09' },
  { label: 'Bihar', value: '10' },
  { label: 'Sikkim', value: '11' },
  { label: 'Arunachal Pradesh', value: '12' },
  { label: 'Nagaland', value: '13' },
  { label: 'Manipur', value: '14' },
  { label: 'Mizoram', value: '15' },
  { label: 'Tripura', value: '16' },
  { label: 'Meghalaya', value: '17' },
  { label: 'Assam', value: '18' },
  { label: 'West Bengal', value: '19' },
  { label: 'Jharkhand', value: '20' },
  { label: 'Odisha', value: '21' },
  { label: 'Chhattisgarh', value: '22' },
  { label: 'Madhya Pradesh', value: '23' },
  { label: 'Gujarat', value: '24' },
  { label: 'Daman and Diu', value: '25' },
  { label: 'Dadra and Nagar Haveli', value: '26' },
  { label: 'Maharashtra', value: '27' },
  { label: 'Karnataka', value: '29' },
  { label: 'Goa', value: '30' },
  { label: 'Lakshadweep', value: '31' },
  { label: 'Kerala', value: '32' },
  { label: 'Tamil Nadu', value: '33' },
  { label: 'Puducherry', value: '34' },
  { label: 'Andaman and Nicobar Islands', value: '35' },
  { label: 'Telangana', value: '36' },
  { label: 'Andhra Pradesh', value: '37' },
  { label: 'Ladakh', value: '38' },
];

module.exports = { AttestationCountryData, companyActivity, supportModules, addressType, companySize, months, paymentMode, years, circleList, typeOfBill, disputeReasons, issueTypes, reportCategory, supportIssueType, bankAccountType, deviceType, kycType, indianStates, gstStates, connectCategory, serviceType,reportSubscription };
