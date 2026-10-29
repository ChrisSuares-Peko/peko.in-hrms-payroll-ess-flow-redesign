import { ErrorMessage } from 'formik';

interface Props {
    name: string;
}

const FormikErrorMessage = ({ name }: Props) => (
    <ErrorMessage name={name} component="div" className="error-message text-red-500 -mt-6 " />
);

export default FormikErrorMessage;
