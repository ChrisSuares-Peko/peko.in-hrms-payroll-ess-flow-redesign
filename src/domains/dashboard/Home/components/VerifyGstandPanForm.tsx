import React, { useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Row, Col, Flex, Spin } from 'antd';
import { FormikProps, useFormikContext } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import TextInputOne from '../../profile/components/TextInputOne';
import VerifyTextInputTwo from '../../profile/components/VerifyTextInputTwo';
import useVerifyGstApi from '../../profile/hooks/useVerifyGstApi';
import useVerifyPanApi from '../../profile/hooks/useVerifyPanApi';
import { validateGstNumber, validatePanNumber } from '../../profile/utils/validation';

const VerifyGstandPanForm = () => {
    const dispatch = useAppDispatch();
    const [, setFile] = useState<any>('');
    const { verifyGstDetails, isLoader } = useVerifyGstApi();
    const { verifyPanDetails, isLoading } = useVerifyPanApi();
    const { values, setFieldValue }: FormikProps<any> = useFormikContext() ?? {};
    const { data } = useAppSelector(state => state.reducer.companyInfo);

    return isLoader || isLoading ? (
        <Flex className="items-center justify-center w-1/3" style={{ height: '70vh' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
    ) : (
        <Row gutter={60} className="">
            <Col xs={24}>
                <TextInputOne
                    type="text"
                    name="activity"
                    label="Activity"
                    placeholder="Enter Activity"
                    classes="rounded-sm"
                    allowAlphabetsAndSpaceOnly
                    isRequired
                />
            </Col>
            <Col xs={24}>
                <VerifyTextInputTwo
                    name="gstNumber"
                    label="GSTIN"
                    type="text"
                    placeholder="Enter GST Number"
                    classes="rounded-sm"
                    maxLength={15}
                    allowAlphabetsAndNumbersOnly
                    onVerify={async () => {
                        if (validateGstNumber(values.gstNumber, dispatch)) {
                            await verifyGstDetails(values.gstNumber);
                            if (data && data.gstVerified) {
                                setFieldValue('gstVerified', true);
                            }
                        }
                    }}
                    verifyText="gstVerified"
                    isVerified={values.gstVerified}
                    isRequired
                />
            </Col>
            <Col xs={24}>
                <FileUploadInput
                    label="Upload GSTIN Certificate"
                    name="gstDoc"
                    setFile={setFile}
                    showNotification
                    format="gstFormat"
                    showFileName
                    isRequired
                />
            </Col>
            <Col xs={24}>
                <VerifyTextInputTwo
                    name="panNumber"
                    label="PAN Number"
                    type="text"
                    placeholder="Enter Pan Card Number"
                    classes="rounded-sm"
                    maxLength={10}
                    allowAlphabetsAndNumbersOnly
                    onVerify={async () => {
                        if (validatePanNumber(values.panNumber, dispatch)) {
                            await verifyPanDetails(values.panNumber);
                            if (data && data.panVerified) {
                                setFieldValue('panVerified', true);
                            }
                        }
                    }}
                    verifyText="panVerified"
                    isVerified={values.panVerified}
                    isRequired
                />
            </Col>
            <Col xs={24}>
                <FileUploadInput
                    label="Upload PAN Card"
                    name="panDoc"
                    setFile={setFile}
                    format="panFormat"
                    showNotification
                    showFileName
                    isRequired
                />
            </Col>
        </Row>
    );
};

export default VerifyGstandPanForm;
