import * as Yup from 'yup';

export const attendanceSchema = Yup.object().shape({
    employeeId: Yup.string().required('Please select an employee'),
    totalWorkDays: Yup.number()
        .typeError('Total work days must be a number')
        .required('Please enter total work days')
        .min(0, 'Total work days cannot be negative'),
    lossOfPay: Yup.number()
        .typeError('Loss of pay must be a number')
        .required('Please enter loss of pay')
        .min(0, 'Loss of pay cannot be negative'),
    totalPayDays: Yup.number()
        .typeError('Total pay days must be a number')
        .required('Please enter total pay days')
        .min(0, 'Total pay days cannot be negative'),
});
