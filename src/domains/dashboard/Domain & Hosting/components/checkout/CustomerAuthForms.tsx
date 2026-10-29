import React from 'react';

import { Alert, Button, Col, Form, type FormInstance, Input, Row, Select } from 'antd';

import { INDIAN_STATES } from '@src/utils/indianLocations';

import { type RegisterCustomerPayload } from '../../types/index';

type AuthMode = 'register' | 'login';

interface Props {
    authMode: AuthMode;
    onAuthModeChange: (mode: AuthMode) => void;
    registerForm: FormInstance;
    loginForm: FormInstance;
    onRegisterSubmit: (values: Omit<RegisterCustomerPayload, 'userId' | 'userType'>) => void;
    onLoginSubmit: (values: { username: string; passwd: string }) => void;
    registerLoading: boolean;
    loginLoading: boolean;
    error: string | null;
    showBackButton: boolean;
    onBack: () => void;
}

const CustomerAuthForms: React.FC<Props> = ({
    authMode,
    onAuthModeChange,
    registerForm,
    loginForm,
    onRegisterSubmit,
    onLoginSubmit,
    registerLoading,
    loginLoading,
    error,
    showBackButton,
    onBack,
}) => (
    <>
        {showBackButton && (
            <Button
                type="link"
                size="small"
                style={{ paddingLeft: 0, marginBottom: 12 }}
                onClick={onBack}
            >
                ← Back to existing customer
            </Button>
        )}

        {/* Register/login toggle hidden — only new registrations allowed */}
        {/* <Flex style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
            {(['register', 'login'] as AuthMode[]).map(mode => (
                <button
                    key={mode}
                    type="button"
                    onClick={() => onAuthModeChange(mode)}
                    style={{
                        flex: 1,
                        padding: '8px 0',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: 14,
                        background: authMode === mode ? '#FF4F4F' : '#fff',
                        color: authMode === mode ? '#fff' : '#374151',
                        transition: 'background 0.2s',
                    }}
                >
                    {mode === 'register' ? 'New Customer' : 'Existing Customer'}
                </button>
            ))}
        </Flex> */}

        {error && <Alert type="error" message={error} showIcon className="mb-4" />}

        {authMode === 'login' && (
            <Form form={loginForm} layout="vertical" onFinish={onLoginSubmit}>
                <Form.Item
                    name="username"
                    label="Email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                        { whitespace: true, message: 'Email cannot be only spaces' },
                    ]}
                >
                    <Input placeholder="Enter Email ID" />
                </Form.Item>
                <Form.Item
                    name="passwd"
                    label="Password"
                    rules={[
                        { required: true, message: 'Please enter your password' },
                        { whitespace: true, message: 'Password cannot be only spaces' },
                    ]}
                >
                    <Input.Password placeholder="Enter Password" />
                </Form.Item>
                <Button
                    htmlType="submit"
                    className="bg-lightRed border-lightRed text-white"
                    loading={loginLoading}
                >
                    Login
                </Button>
            </Form>
        )}

        {authMode === 'register' && (
            <Form form={registerForm} layout="vertical" onFinish={onRegisterSubmit}>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="name"
                            label="Name"
                            validateFirst
                            rules={[
                                { required: true, message: 'Please enter the name' },
                                { pattern: /^\S/, message: 'Name cannot start with whitespace' },
                                { pattern: /\S$/, message: 'Name cannot end with whitespace' },
                                { pattern: /^(?!.*\s{2})/, message: 'Name cannot contain consecutive whitespaces' },
                                { pattern: /^[a-zA-Z\s]+$/, message: 'Please enter a valid full name using only letters' },
                                { min: 3, message: 'Name must be at least 3 characters' },
                            ]}
                        >
                            <Input placeholder="Enter Name" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="company"
                            label="Company"
                            validateFirst
                            rules={[
                                { required: true, message: 'Please enter the company name' },
                                { pattern: /^\S/, message: 'Company name cannot start with a blank space' },
                                { pattern: /\S$/, message: 'Company name cannot end with a blank space' },
                                { pattern: /^(?!.*\s{2})/, message: 'Company name cannot contain consecutive blank spaces' },
                                { pattern: /^[a-zA-Z0-9\s\-&]+$/, message: 'Please enter a valid company name using letters, numbers, spaces, - and &' },
                                { min: 3, message: 'Company name must be at least 3 characters' },
                            ]}
                        >
                            <Input placeholder="Enter Company Name" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="username"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter the email' },
                                { type: 'email', message: 'Please enter a valid business email ID' },
                            ]}
                        >
                            <Input placeholder="Enter Email ID" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="phone"
                            label="Phone"
                            normalize={v => v?.replace(/\D/g, '')}
                            rules={[
                                { required: true, message: 'Please enter the phone number' },
                                { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit mobile number' },
                            ]}
                        >
                            <Input placeholder="Enter Phone Number" maxLength={10} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="addressLine1"
                            label="Address"
                            validateFirst
                            rules={[
                                { required: true, message: 'Please enter the address' },
                                { pattern: /^\S/, message: 'Address cannot start with a whitespace' },
                                { pattern: /\S$/, message: 'Address cannot end with a whitespace' },
                                { pattern: /^(?!.*\s{2})/, message: 'Address cannot contain consecutive whitespaces' },
                                { pattern: /^[a-zA-Z0-9\s,.\-/#]+$/, message: 'Please enter a valid address' },
                                { min: 3, message: 'Address must be at least 3 characters' },
                            ]}
                        >
                            <Input placeholder="Enter Address" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="city"
                            label="City"
                            validateFirst
                            rules={[
                                { required: true, message: 'Please enter the city' },
                                { whitespace: true, message: 'City cannot be only spaces' },
                            ]}
                        >
                            <Input placeholder="Enter City" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="state"
                            label="State"
                            rules={[{ required: true, message: 'Please select the state' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select State"
                                optionFilterProp="label"
                                options={INDIAN_STATES.map(s => ({ value: s.name, label: s.name }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="zipcode"
                            label="Pin Code"
                            normalize={v => v?.replace(/\D/g, '')}
                            rules={[
                                { required: true, message: 'Please enter the Pin Code' },
                                { pattern: /^\d{6}$/, message: 'Please enter a valid Pin Code' },
                                {
                                    validator: (_, value) => {
                                        if (!value || value !== '000000') return Promise.resolve();

                                        return Promise.reject(new Error('Please enter a valid Pin Code'));
                                    },
                                },
                            ]}
                        >
                            <Input placeholder="Enter Pin Code" />
                        </Form.Item>
                    </Col>
                </Row>
                <Button
                    htmlType="submit"
                    className="bg-lightRed border-lightRed text-white"
                    loading={registerLoading}
                >
                    Register Customer
                </Button>
            </Form>
        )}
    </>
);

export default CustomerAuthForms;
