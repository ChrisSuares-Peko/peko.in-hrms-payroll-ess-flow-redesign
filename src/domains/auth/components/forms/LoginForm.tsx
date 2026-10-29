import { Row, Typography, Form, Button } from 'antd';
import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import PasswordInput from '@components/atomic/inputs/PasswordInput';
import TextInput from '@components/atomic/inputs/TextInput';
// import { useAppSelector } from '@src/hooks/store';

import useLoginApi from '../../hooks/useLoginApi';
import { loginSchema } from '../../schema';

const { Text } = Typography;


const LoginForm = () => {
    const { handleLogin } = useLoginApi();
    // const data = useAppSelector(state => state.reducer.auth);

    return (
        <>
            {' '}
            <Formik
                initialValues={{ username: '', password: '' }}
                onSubmit={handleLogin}
                validationSchema={loginSchema}
            >
                {({ handleSubmit, isSubmitting }) => (
                    <Form onFinish={handleSubmit} className="w-full xxl:w-[27rem] ">
                        <TextInput
                            name="username"
                            placeholder="Email ID/Account Number"
                            type="text"
                            size="large"
                            classes="xxl:h-[3rem] "
                        />
                        <PasswordInput
                            name="password"
                            placeholder="Password"
                            type="password"
                            size="large"
                            classes="xxl:h-[3rem] "
                        />
                        <Row justify="end" className="w-full">
                            {/* <Checkbox onChange={onChange}>Keep me logged in</Checkbox> */}
                            <Link to="/auth/forgotpassword" className="p-0" type="link">
                                <Text>Forgot Password?</Text>
                            </Link>
                        </Row>
                        <Button
                            htmlType="submit"
                            type="primary"
                            danger
                            className="mt-5 font-semibold w-full xxl:h-[3rem] xxl:text-lg"
                            loading={isSubmitting}
                        >
                            Login
                        </Button>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default LoginForm;
