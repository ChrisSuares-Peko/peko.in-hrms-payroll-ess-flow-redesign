import * as Yup from 'yup';

const otRateValidation = Yup.string()
    .required('Please enter the overtime rate')
    .test('gt-zero', 'OT rate must be greater than 0', v => !v || parseFloat(v) > 0)
    .test('finite', 'OT rate must be a valid number', v => !v || Number.isFinite(parseFloat(v)));

export const editOvertimeSchema = Yup.object().shape({
    overTimeDate: Yup.string().required('Please select the date'),
    extraHours: Yup.string()
        .required('Please enter the number of extra hours')
        .test('gt-zero', 'Extra hours must be greater than 0', v => !v || parseFloat(v) > 0),
    overTimeRate: otRateValidation,
    totalWorkingHours: Yup.string()
        .required('Please enter the total working hours')
        .test('gt-zero', 'Total working hours must be greater than 0', v => !v || parseFloat(v) > 0)
        .test('lte-24', 'Total working hours cannot exceed 24', v => !v || parseFloat(v) <= 24)
        .test(
            'gt-extra-hours',
            'Total working hours must be greater than extra hours',
            function totalGtExtra(v) {
                const extra = parseFloat(this.parent.extraHours);
                return !v || Number.isNaN(extra) || parseFloat(v) > extra;
            }
        ),
    notes: Yup.string()
        .optional()
        .test('no-leading-space', 'Notes cannot start with a whitespace', v => !v || !/^\s/.test(v))
        .test('no-trailing-space', 'Notes cannot end with a whitespace', v => !v || !/\s$/.test(v))
        .test('no-consecutive-spaces', 'Notes cannot contain consecutive whitespaces', v => !v || !/\s{2,}/.test(v)),
});
