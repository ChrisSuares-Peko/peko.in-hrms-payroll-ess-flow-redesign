import * as Yup from 'yup';

export const leaveSchema = Yup.object().shape({
    employeeId: Yup.string().required('Please select a employee'),
    typeOfLeave: Yup.string().required('Please select a type of leave'),
    // leaveCount: Yup.string().required('Please enter duration of leave'),
    leaveCount: Yup.number()
        .moreThan(0, 'Leave count must be greater than zero')
        .test(
      'leave-count-validation',
      'Leaves with half-day durations (e.g., 0.5, 1.5, 2.5) are allowed only for Annual leave or Sick leave',
      function validation(value) {
        const { typeOfLeaveValue } = this.parent;
        if (!value) return false;

        // Annual and Sick → allow 0.5 steps
        console.log(typeOfLeaveValue,typeOfLeaveValue?.toLowerCase().startsWith('annual') ,value%0.5);
        if (typeOfLeaveValue?.toLowerCase().startsWith('annual') || typeOfLeaveValue?.toLowerCase().startsWith('sick')) {
          return value % 0.5 === 0;
        }

        // Other leaves → only integers
        return Number.isInteger(value);
      }
    ).required('Please enter duration of leave'),
    start: Yup.string().required('Please choose leave start date'),
    end: Yup.string().required('Please choose leave end date'),
    leaveSupportingDocs: Yup.string(),
});
