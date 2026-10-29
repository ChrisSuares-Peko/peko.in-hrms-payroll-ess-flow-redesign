export interface LeaveBalance {
  availableLeave: number;
  carryOverBalance: number;
}

export interface LeaveRow {
  _id: string;
  corporateUser: string;
  employee: string;
  typeOfLeave: string;
  start: string;
  end: string;
  leaveCount: number;
  createdAt: string;
  leaveTypeName:string;
  updatedAt: string;
  __v: number;
  leaveBalance: LeaveBalance;
}

export interface EmployeeDetails {
  fullName: string;
  designation: string;
  profileImage: string | null;
}

export interface LeaveProfileResponse {
  count: number;
  employeeDetails: EmployeeDetails;
  rows: LeaveRow[];
}
export interface LeaveSummaryData {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  leaveTaken: string;
  leaveBalance: string;
  leaveTypeName:string;
}


export interface UseLeaveProfileDetailsApi {
  leaveData: LeaveSummaryData[];
  employeeDetails: EmployeeDetails | null;
  getLeave: (empId: string) => Promise<void>;
  isLoading?:boolean
}


export interface LeaveSummaryRow {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  leaveTaken: string;
  leaveBalance: string;
  leaveTypeName:string;
  
}

export interface LeaveQueryParams {
    empId: string;
    page: number;
    limit: number;
    month: number;
    year: number;
}

