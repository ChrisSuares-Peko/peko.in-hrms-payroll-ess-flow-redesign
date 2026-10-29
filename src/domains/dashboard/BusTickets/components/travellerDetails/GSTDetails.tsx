import { MutableRefObject, useState } from 'react';

import { Checkbox, Col, Divider, Flex, Form, Row, Typography } from 'antd';
import { Formik } from 'formik';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { gstSchema, gstSchemaRequired } from '../../schema';

type Props = {
    formRef?: MutableRefObject<any>;
};

export default function GSTDetails({ formRef }: Props) {
    const [hasGST, setHasGST] = useState(false);

    return (
        <Flex
            vertical
            gap={20}
            style={{
                background: 'white',
                border: '1px solid #D9D9D9',
                borderRadius: 16,
                padding: 30,
            }}
        >
            <Flex justify="space-between" align="center">
                <Checkbox checked={hasGST} onChange={e => setHasGST(e.target.checked)}>
                    <Typography.Text style={{ fontSize: 14 }}>I have a GST Number</Typography.Text>
                </Checkbox>
                <span
                    style={{
                        fontSize: 14,
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        padding: '4px 8px',
                        background: '#F8FAFC',
                    }}
                >
                    Optional
                </span>
            </Flex>

            {hasGST && (
                <>
                    <Divider dashed style={{ margin: 0 }} />
                    <Formik
                        initialValues={{ gstName: '', gstId: '', gstEmail: '', gstAddress: '' }}
                        validationSchema={hasGST ? gstSchemaRequired : gstSchema}
                        innerRef={formRef}
                        onSubmit={() => {}}
                    >
                        {({ handleSubmit }) => (
                            <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                                <Row className="mt-2">
                                    <Col span={24}>
                                        <TextInput
                                            name="gstName"
                                            label="Registration Name"
                                            placeholder="Enter registration name"
                                            type="text"
                                            isRequired={hasGST}
                                            allowAlphabetsAndSpaceOnly
                                        />
                                    </Col>
                                </Row>
                                <Row className="mt-2">
                                    <Col span={24}>
                                        <TextInput
                                            name="gstId"
                                            label="GST ID"
                                            placeholder="Enter GST ID"
                                            type="text"
                                            convertToUppercase
                                            isRequired={hasGST}
                                        />
                                    </Col>
                                </Row>
                                <Row className="mt-2">
                                    <Col span={24}>
                                        <TextInput
                                            name="gstEmail"
                                            label="Email ID"
                                            placeholder="Enter email ID"
                                            type="text"
                                            allowEmailsOnly
                                            isRequired={hasGST}
                                        />
                                    </Col>
                                </Row>
                                <Row className="mt-2">
                                    <Col span={24}>
                                        <TextAreaInput
                                            name="gstAddress"
                                            label="Address"
                                            placeholder="Enter address"
                                            minLength={3}
                                            maxLength={150}
                                            minRows={3}
                                            showCount
                                            allowedCharacters="a-zA-Z0-9 ./,-"
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                            </Form>
                        )}
                    </Formik>
                </>
            )}
        </Flex>
    );
}
