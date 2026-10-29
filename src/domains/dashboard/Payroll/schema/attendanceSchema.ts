import * as Yup from 'yup';

const requiresTime = (status: string | undefined) => status === 'present' || status === 'late';

export const markAttendanceSchema = Yup.object().shape({
    employee: Yup.string().required('Please select an employee'),
    date: Yup.string().required('Please select a date'),
    status: Yup.string().required('Please select a status'),
    checkIn: Yup.string().when('status', {
        is: requiresTime,
        then: schema => schema.required('Please select a check-in time'),
        otherwise: schema => schema.optional(),
    }),
    checkOut: Yup.string()
        .optional()
        .test(
            'after-check-in',
            'Check-out time must be after check-in time',
            function validateCheckOut(checkOut) {
                const { checkIn } = this.parent;
                if (!checkIn || !checkOut) return true;
                return checkOut > checkIn;
            }
        ),
    notes: Yup.string()
        .optional()
        .min(3, 'Notes must be at least 3 characters')
        .test('no-leading-space', 'Notes cannot start with a whitespace', v => !v || !/^\s/.test(v))
        .test('no-trailing-space', 'Notes cannot end with a whitespace', v => !v || !/\s$/.test(v))
        .test(
            'no-consecutive-spaces',
            'Notes cannot contain consecutive whitespaces',
            v => !v || !/\s{2,}/.test(v)
        ),
});

// Only the "Mark Attendance" create flow collects a leave type (to deduct the
// matching leave balance) — "Edit Attendance" keeps using markAttendanceSchema as-is.
export const markAttendanceCreateSchema = markAttendanceSchema.shape({
    typeOfLeave: Yup.string().when('status', {
        is: 'on-leave',
        then: schema => schema.required('Please select a leave type'),
        otherwise: schema => schema.optional(),
    }),
});
