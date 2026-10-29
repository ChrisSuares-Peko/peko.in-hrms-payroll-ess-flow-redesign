import React from 'react';

import { Button, Col, Form, InputNumber, Modal, Row } from 'antd';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import { personsList } from '../utils/data';

interface EnterAgeModalProps {
    open: boolean;
    handleCancel: () => void;
}

const EnterAgeModal = ({ open, handleCancel }: EnterAgeModalProps) => {
    const navigate = useNavigate();
    return (
        <Formik
            initialValues={{ personName: '', personAge: '' }}
            onSubmit={async values => {
            
                await new Promise(resolve => setTimeout(resolve, 1000));
                handleCancel();
                navigate('list');
            }}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Modal
                    title="Enter Age Of All Family Members"
                    open={open}
                    onOk={() => handleSubmit()}
                    confirmLoading={isSubmitting}
                    onCancel={handleCancel}
                    centered
                    footer={[
                        <Button
                            key="submit"
                            danger
                            type="primary"
                            block
                            className="mt-10 rounded-sm"
                            loading={isSubmitting}
                            onClick={() => handleSubmit()}
                        >
                            Get Quotes
                        </Button>,
                    ]}
                >
                    <Form layout="vertical">
                        <Row className="mt-6 items-center " gutter={[0, 20]}>
                            {personsList.map((item, i) => (
                                <React.Fragment key={i}>
                                    <Col
                                        xs={{ span: 12, offset: 0 }}
                                        sm={{ span: 5, offset: i % 2 !== 0 ? 4 : 0 }}
                                    >
                                        {item.personName}
                                    </Col>
                                    <Col xs={12} sm={5}>
                                        <InputNumber
                                            size="small"
                                            className="px-2"
                                            min={1}
                                            max={100}
                                            placeholder="Enter Age"
                                        />
                                    </Col>
                                </React.Fragment>
                            ))}
                        </Row>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default EnterAgeModal;
