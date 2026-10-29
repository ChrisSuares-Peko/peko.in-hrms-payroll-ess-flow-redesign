import * as Yup from 'yup';

const vendorSchema = (status: string) =>
    Yup.object().shape({
        remarks: Yup.string()
            .when([], (__, schema) =>
                status === 'RE UPLOAD' ? schema.required('Please enter remarks') : schema
            )
            .min(3, 'Remarks must be at least 3 characters')
            .test('no-consecutive-spaces', 'Remarks cannot contain consecutive spaces', value => {
                if (value) {
                    return !/\s{2,}/.test(value);
                }
                return true;
            }),
    });

export default vendorSchema;
