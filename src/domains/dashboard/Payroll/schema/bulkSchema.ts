import * as Yup from 'yup';

export const fileSchema = Yup.object().shape({
    file: Yup.mixed()
        .required('Please upload a file in excel format')
        .test('fileSize', 'The file is too large', value => {
            if (!value) return false; // If there's no file, fail this test
            const file = value as File; // Assert that value is of type File
            return file.size <= 1024 * 1024; // Example: limit file size to 1MB
        })
        .test('fileFormat', 'Please upload a file in xlsx format', value => {
            if (!value) return false; // If there's no file, fail this test
            const file = value as File; // Assert that value is of type File
            return [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ].includes(file.type); // Adjust MIME types as necessary
        }),
});

export const selectEmployeeSchema = Yup.object({
    employee: Yup.string().required('Please select an employee.'),
});
