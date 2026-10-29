import * as Yup from 'yup';

export const bulkCustomerFileSchema = Yup.object().shape({
    file: Yup.mixed()
        .required('Please upload a file in excel format')
        .test('fileFormat', 'Please upload a file in xlsx format', value => {
            if (!value) return false;
            const file = value as File;
            return [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ].includes(file.type);
        }),
});
