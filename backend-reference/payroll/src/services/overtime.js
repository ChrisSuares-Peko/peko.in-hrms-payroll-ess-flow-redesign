const { getEmployeesUsingId } = require("../models/use-cases/employee");
const SalaryComponent = require("../models/entities/salaryComponent");

exports.calculateOvertimeAmount = async (params) => {
    try {
        const employeeId = params.employeeId;
        const overtimeHours = params.overtimeHours;
        const overtimeRate = params.overtimeRate;




        const employeeDetails = await getEmployeesUsingId(employeeId);


       

        if (!employeeDetails ) {
            return {
                status: false,
                responseCode: '001',
                message: 'something went wrong while calculating overtime data',
                data: {}
            }
        }

        //find basic salary
        const queryConditions = {
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
        };
  
      
        const globalComponentData = await SalaryComponent.find({
            corporateUser: params.corporateUserID,
            employee: null,
            isGlobal:true
        });
        const employeeComponentData = await SalaryComponent.find(queryConditions);
  
        const employeeComponentMap = new Map(
            employeeComponentData
                .filter(component => component.globalComponentId)
                .map(component => [component.globalComponentId.toString(), component])
        );
  
        const combinedComponentData = globalComponentData.map(globalComponent => {
            const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());
  
            return overriddenComponent || globalComponent;
        });
        const uniqueEmployeeComponents = employeeComponentData.filter(component => !component.globalComponentId);
        combinedComponentData.push(...uniqueEmployeeComponents);
        const basicSalaryComponent = combinedComponentData.find(
            (component) => component.componentName === 'Basic Salary'
        );
        //find working hours
        const workingHoursPerDay = employeeDetails?.employeeInformation?.workingHours || 0;
        const noOfWorkingDays =employeeDetails?.employeeInformation?.workingDays || 0;

        //total standard working hours
        const totalStandardWorkingHours = noOfWorkingDays * workingHoursPerDay

        //hourly rate
        const amount = basicSalaryComponent?.amountPercentage ?? 0;
        const hours = totalStandardWorkingHours > 0 ? totalStandardWorkingHours : 1;
        const hourlyRate = (amount / hours).toFixed(2);
        // const hourlyRate = (basicSalaryComponent?.amountPercentage ||0 / totalStandardWorkingHours).toFixed(2);

        //overtime rate
        const overtimePay = (overtimeHours * (hourlyRate * overtimeRate)).toFixed(2);

        console.log({workingHoursPerDay,noOfWorkingDays,totalStandardWorkingHours,hourlyRate,overtimePay})


        return {
            status: true,
            responseCode: '000',
            message: 'OverTime amount calculated successfully',
            data: { overtimeAmount: parseFloat(overtimePay), hourlyRate, totalWorkingHours: workingHoursPerDay }
        };

    } catch (error) {
        return {
            status: false,
            responseCode: '001',
            message: error.message,
            data: {}
        }

    }
}