import React, { useEffect, useState } from 'react';

import { Alert, Col, Form, Row, Spin } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import SignDeskBranding from '../components/SignDeskBranding';
import DetailsForm from '../components/viewPage/DetailsForm';
import PdfUploadFailure from '../components/viewPage/PdfUploadFailure';
import ReviewPageHeader from '../components/viewPage/ReviewPageHeader';
import SignerDetails from '../components/viewPage/SignerDetails';
import ThumbnailExample from '../components/viewPage/ThumbnailExample';
import { useESignDocument } from '../hooks/useESignDocument';
import { eSignDocSchema } from '../schema';
import {
    clearESignDocData,
    clearSignerCoordinates,
    clearSignerArray,
} from '../slices/eSignDocSlice';

interface ViewPageProps {}

const ViewPage: React.FC<ViewPageProps> = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, getOrderDetails, eSignDocument } = useESignDocument();
    useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const [error, setError] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [expandedSignerIndex, setExpandedSignerIndex] = useState<number | null>(0);
    const { document_url, isDisabled, id } = useAppSelector(state => state.reducer.eSignDoc);
    const {
        docket_title,
        expiry_date,
        reminder,
        reminder_interval,
        documentBase64,
        sequentialSignature,
        signingPolicy,
        signers_info,
        initiator_name,
        initiator_email,
        termsofUse,
    } = useAppSelector(state => state.reducer.eSignDoc);

    const initialSigner = [
        {
            sequence: '1',
            signer_index: 0,
            signer_name: user?.contactPersonName || '',
            signer_email: user?.email || '',
            // signer_mobile: user?.mobileNo || '',
            signingPolicy: 'QUICKSIGN' as const,
        },
    ];

    const initialValues = {
        docket_title: docket_title || '',
        expiry_date: expiry_date || '',
        reminder: reminder || false,
        reminder_interval: reminder_interval || undefined,
        documentBase64,
        sequentialSignature: sequentialSignature || false,
        signingPolicy: signingPolicy || 'QUICKSIGN',
        signers_info: signers_info.length === 0 ? initialSigner : signers_info,
        initiator_name: isDisabled ? initiator_name || '' : user?.contactPersonName || '',
        initiator_email: isDisabled ? initiator_email || '' : user?.email || '',
        termsofUse,
    };
    useEffect(() => {
        dispatch(clearSignerCoordinates());
        dispatch(clearSignerArray());
    }, [dispatch]);
    useEffect(() => {
        if ((!document_url && !isDisabled) || (!id && isDisabled)) {
            navigate(paths.dashboard.eSign);
        }
        if (isDisabled && id) {
            getOrderDetails(Number(id));
        }

        return () => {
            dispatch(clearESignDocData());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, navigate]);
    useEffect(() => {
        // Check if the device supports touch
        //  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasTouchSupport = 'ontouchstart' in document.documentElement;
        setIsTouchDevice(hasTouchSupport);

       
    }, []);
    const onFormSubmit = async (values: any) => {
        const normalizedSigners = values.signers_info.map((signer: any, index: number) => ({
            ...signer,
            sequence: index + 1,
            signer_index: index,
        }));

        const updatedValues = { ...values, signers_info: normalizedSigners };
        const status = await eSignDocument({ ...updatedValues, isTouchDevice });

        if (status) {
            navigate(`${paths.dashboard.eSign}/${paths.eSign.successPage}`);
        }
    };

    return (
        <Content>
            <Spin
                spinning={isLoading}
                size="default"
                style={{
                    position: 'fixed',
                    top: '50vh',
                    left: '50vw',
                    transform: 'translate(-50%, -50%)',
                    background: 'transparent',
                    border: 'none',
                    height: 'fit-content',
                    width: 'fit-content',
                    zIndex: 1000, // On top of the overlay
                }}
            >
                <Col span={24}>
                    <SignDeskBranding className=" " isHeader />
                </Col>

                {error ? (
                    <PdfUploadFailure />
                ) : (
                    <Formik
                        initialValues={initialValues}
                        validationSchema={eSignDocSchema}
                        onSubmit={onFormSubmit}
                        enableReinitialize
                    >
                        {({ values, handleSubmit, errors }) => (
                            <Form layout="vertical" onFinish={handleSubmit}>
                                <Row gutter={[16, 16]}>
                                    <Col span={24}>
                                        <ReviewPageHeader />
                                    </Col>

                                    <Col span={24}>
                                        <Row>
                                            <Col xs={24} md={16} lg={10}>
                                                <TextInput
                                                    label="Document Name"
                                                    name="docket_title"
                                                    placeholder="Enter document name"
                                                    type="text"
                                                    isRequired
                                                    maxLength={50}
                                                    isDisabled={isDisabled}
                                                />
                                            </Col>
                                        </Row>

                                        {!isDisabled && isTouchDevice && (
                                            <Alert
                                                message="Note: Double Tap on the document to sign"
                                                type="warning"
                                                showIcon
                                                className="w-fit mt-2"
                                            />
                                        )}
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]} className="mt-4">
                                    <Col xs={24} lg={17}>
                                        <ThumbnailExample setError={setError} />
                                    </Col>

                                    <Col xs={24} lg={7}>
                                        <SignerDetails
                                            values={values.signers_info}
                                            expandedIndex={expandedSignerIndex}
                                            setExpandedIndex={setExpandedSignerIndex}
                                        />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={24}>
                                        <DetailsForm
                                            errors={errors}
                                            setExpandedIndex={setExpandedSignerIndex}
                                            signersLength={values.signers_info.length}
                                        />
                                    </Col>
                                </Row>
                            </Form>
                        )}
                    </Formik>
                )}
            </Spin>
        </Content>
    );
};

export default ViewPage;
