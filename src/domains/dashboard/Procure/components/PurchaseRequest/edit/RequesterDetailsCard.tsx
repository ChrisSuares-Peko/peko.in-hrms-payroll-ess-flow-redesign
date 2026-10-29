import React from 'react';

import { AutoComplete, Card, Col, Divider, Form, Row } from 'antd';
import { Field, FieldProps, getIn } from 'formik';

import purchaseRequestIcon1 from '@src/domains/dashboard/Procure/assets/icons/purchaseRequestIcon1.svg';

import SectionHeader from './SectionHeader';
import { sectionCard } from './shared';

interface EmployeeOption {
    value: string;
    label: string;
    fullName: string;
    department: string;
}

interface Props {
    setFieldValue: (field: string, value: any) => void;
    setFieldTouched: (field: string, touched: boolean, validate?: boolean) => void;
    employeeOptions: EmployeeOption[];
}

const RequesterDetailsCard: React.FC<Props> = ({ setFieldValue, setFieldTouched, employeeOptions }) => (
    <Card {...sectionCard}>
        <SectionHeader icon={purchaseRequestIcon1} title="Requester Details" subtitle="Who is this request on behalf of?" iconSize={30} />
        <Divider className="!my-3 !-mx-6" style={{ width: 'calc(100% + 48px)' }} />
        <Row gutter={16} style={{ marginBottom: 0 }}>
            <Col xs={24}>
                <Field name="requestedBy">
                    {({ form: { touched, errors, values } }: FieldProps) => (
                        <Form.Item
                            label={<span>Requested By</span>}
                            required
                            validateStatus={getIn(touched, 'requestedBy') && getIn(errors, 'requestedBy') ? 'error' : ''}
                            help={
                                getIn(touched, 'requestedBy') && getIn(errors, 'requestedBy')
                                    ? (getIn(errors, 'requestedBy') as React.ReactNode)
                                    : undefined
                            }
                        >
                            <AutoComplete
                                allowClear
                                placeholder="Type or select a name"
                                value={getIn(values, 'requestedBy') || undefined}
                                options={employeeOptions}
                                filterOption={(input, option) =>
                                    ((option?.label ?? '') as string)
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                onChange={(value: string) => {
                                    setFieldValue('requestedBy', value ?? '');
                                    if (value) setTimeout(() => setFieldTouched('requestedBy', true, true), 0);
                                }}
                                onBlur={() => {
                                    setTimeout(() => setFieldTouched('requestedBy', true, true), 150);
                                }}
                                onSelect={(value: string) => {
                                    const emp = employeeOptions.find(e => e.value === value);
                                    setFieldValue('requestedBy', emp?.fullName ?? value);
                                    if (emp?.department) setFieldValue('department', emp.department);
                                }}
                                onClear={() => {
                                    setFieldValue('requestedBy', '');
                                    setFieldValue('department', '');
                                    setFieldTouched('requestedBy', true, true);
                                }}
                            />
                        </Form.Item>
                    )}
                </Field>
            </Col>
        </Row>
    </Card>
);

export default RequesterDetailsCard;
