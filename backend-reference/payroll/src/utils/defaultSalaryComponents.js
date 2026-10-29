const defaultSalaryComponents = (corporateUserID) => [
  {
    corporateUser: corporateUserID,
    componentName: 'Basic Salary',
    // category: 'SALARY',
    // Basic is always "% of Gross" when PERCENTAGE — never "% of Basic", which would be
    // circular (see EditBasicSalaryModal.tsx's identical convention on the frontend).
    calculationType: 'PERCENTAGE',
    amountPercentage: 50,
    calculationBasis: 'GROSS_SALARY',
    calculationFrequency: 'MONTHLY',
    status: 'ACTIVE',
    isGlobal: true,
  },
  {
    corporateUser: corporateUserID,
    componentName: 'House Rent Allowance',
    // category: 'ALLOWANCE',
    calculationType: 'PERCENTAGE',
    amountPercentage: 50,
    calculationBasis: 'BASIC_SALARY',
    calculationFrequency: 'MONTHLY',
    status: 'ACTIVE',
    isGlobal: true,
  },
  // Every org needs a Balancing component — it's what absorbs whatever remains of Gross
  // after Basic/HRA/fixed allowances, so an employee's earnings always add up to their
  // actual salary. Seeded by default (same as Basic Salary and HRA above) rather than left
  // for the user to remember to add — see salaryCompFormSchema/SalaryCompTable's onboarding
  // "Next" guard, which now blocks proceeding without one. Named "Other Allowance" rather
  // than "Special Allowance" — the only two names a Balancing component is allowed to have
  // (see createSalaryComponent/editSalaryComponent's validation) — since only one Balancing
  // component can exist at a time and this is the one the system seeds automatically.
  {
    corporateUser: corporateUserID,
    componentName: 'Other Allowance',
    calculationType: 'BALANCING',
    calculationFrequency: 'MONTHLY',
    status: 'ACTIVE',
    isGlobal: true,
  },
  // {
  //   corporateUser: corporateUserID,
  //   componentName: 'Dearness Pay',
  //   category: 'ALLOWANCE',
  //   calculationType: 'FIXED',
  //   amount: 0,
  //   calculationFrequency: 'MONTHLY',
  //   status: 'ACTIVE',
  //   isGlobal: true,
  // },
  // {
  //   corporateUser: corporateUserID,
  //   componentName: 'Leave Travel Allowance',
  //   category: 'ALLOWANCE',
  //   calculationType: 'FIXED',
  //   amount: 0,
  //   calculationFrequency: 'MONTHLY',
  //   status: 'ACTIVE',
  //   isGlobal: true,
  // },    
  // {
  //   corporateUser: corporateUserID,
  //   componentName: 'Conveyance Allowance',
  //   category: 'ALLOWANCE',
  //   calculationType: 'FIXED',
  //   amount: 0,
  //   calculationFrequency: 'MONTHLY',
  //   status: 'ACTIVE',
  //   isGlobal: true,
  // },
  // {
  //   corporateUser: corporateUserID,
  //   componentName: 'Overtime Allowance',
  //   category: 'ALLOWANCE',
  //   calculationType: 'FIXED',
  //   amount: 0,
  //   calculationFrequency: 'MONTHLY',
  //   status: 'ACTIVE',
  //   isGlobal: true,
  // },
  // {
  //   corporateUser: corporateUserID,
  //   componentName: 'Medical Allowance',
  //   category: 'ALLOWANCE',
  //   calculationType: 'FIXED',
  //   amount: 0,
  //   calculationFrequency: 'MONTHLY',
  //   status: 'ACTIVE',
  //   isGlobal: true,
  // },
  // {
  //   corporateUser: corporateUserID,
  //   componentName: 'Special Allowance',
  //   category: 'ALLOWANCE',
  //   calculationType: 'FIXED',
  //   amount: 0,
  //   calculationFrequency: 'MONTHLY',
  //   status: 'ACTIVE',
  //   isGlobal: true,
  // },
];

// PF is no longer seeded as a Deduction Component — it's fully driven by Compliance
// Settings > EPF (see resolveEpfPolicyFromComplianceSettings/calculateEmployerPf.js) and
// calculated live via getEmployeeDeductionComponentsList, which never reads this list.
// Orgs should see an empty Deductions tab by default.
const defaultDeductionComponents = () => [];
module.exports = { defaultSalaryComponents, defaultDeductionComponents };
