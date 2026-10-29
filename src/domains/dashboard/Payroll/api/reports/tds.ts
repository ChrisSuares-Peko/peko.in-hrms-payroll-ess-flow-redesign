import { ApiClient } from '@src/services/config';

import {Form16DownloadPayload, TDSPayload, TDSReportbyEmployee, TDSReportExcelPayload, TDSReportItem } from '../../types/types';

export const getTDSReporList = async (payload: TDSPayload & {regimeType?:string}) => {
    try {
const resp:{tdsDetails:TDSReportItem[]} = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/reports/tdsReportsList`,{
                params:{month:payload.month,year:payload.year,regimeType:payload.regimeType}
            }
        );

        const  {tdsDetails}  = resp;

        return tdsDetails;
    } catch (err) {
        return false;
    }
};

export const getTDSReporListByEmployee = async (payload: TDSPayload) => {
    try {
const resp:{tdsDetails:TDSReportbyEmployee} = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/reports/tdsReortsDetails`,{
                params:{month:payload.month,year:payload.year,employee:payload.eid}
            }
        );

        const  {tdsDetails}  = resp;

        return tdsDetails;
    } catch (err) {
        return false;
    }
};

export const getForm16Download = async (payload:Form16DownloadPayload)=>{
    try {
        const resp = await ApiClient.get(
                    `${payload.userType}/${payload.userId}/payroll/reports/form16/download`,{
                        params:{assessmentYear:payload.year,employee:payload.eid,formType:payload.formtype}
                    }
                );
        
          
        
                return resp.data;
            } catch (err) {
                return false;
            }
}

export const getTdsReportExcel = async (payload:TDSReportExcelPayload)=>{
    try {
        const resp = await ApiClient.get(
                    `${payload.userType}/${payload.userId}/payroll/reports/tdsReportsList/excel`,{
                        params:{year:payload.year,month:payload.month,regimeType:payload.regimeType}
                    }
                );
        
          
        
                return resp.data;
            } catch (err) {
                return false;
            }
}