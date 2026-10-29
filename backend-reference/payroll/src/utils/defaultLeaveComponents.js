const defaultLeaveComponents = (corporateUserID) => [
  {
    corporateUser: corporateUserID,
    leaveType: 'Annual Leave',
    accrualType: 'FIXED',
    accrualRate: 'N/A',
    maximumNumberOfLeaves: 30,
    leaveBalanceCarryover: 'ALLOWED',
    isGlobal: true,
    status: 'ACTIVE'
  },
  {
    corporateUser: corporateUserID,
    leaveType: 'Sick Leave',
    accrualType: 'FIXED',
    accrualRate: 'N/A',
    maximumNumberOfLeaves: 15,
    leaveBalanceCarryover: 'NOT_ALLOWED',
    isGlobal: true,
    status: 'ACTIVE'
  },
  {
    corporateUser: corporateUserID,
    leaveType: 'Maternity Leave',
    accrualType: 'FIXED',
    accrualRate: 'N/A',
    maximumNumberOfLeaves: 90,
    leaveBalanceCarryover: 'NOT_ALLOWED',
    isGlobal: true,
    status: 'ACTIVE',
    applicableGender: 'FEMALE'
  },
  {
    corporateUser: corporateUserID,
    leaveType: 'Paternity Leave',
    accrualType: 'FIXED',
    accrualRate: 'N/A',
    maximumNumberOfLeaves: 7,
    leaveBalanceCarryover: 'NOT_ALLOWED',
    isGlobal: true,
    status: 'ACTIVE',
    applicableGender: 'MALE'
  },
  {
    corporateUser: corporateUserID,
    leaveType: 'Casual Leave',
    accrualType: 'MONTHLY',
    accrualRate: '1',
    maximumNumberOfLeaves: 12,
    leaveBalanceCarryover: 'NOT_ALLOWED',
    isGlobal: true,
    status: 'ACTIVE'
  }
];

module.exports = defaultLeaveComponents;
