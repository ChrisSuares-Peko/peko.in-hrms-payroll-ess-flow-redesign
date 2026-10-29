import { useEffect, useState } from 'react';

import { Card, Checkbox, Col, Flex, Row, Typography } from 'antd';
import { Form, Formik } from 'formik';
import { useDispatch } from 'react-redux';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { GSTValidation } from '../schema/ReceiverDetailsSchema';
import { setGSTDetails, setGSTDetailsValid } from '../slices/airlineSlice';
import { AllFareQuote } from '../types/fareRules';

type Props = {
    fareQuotes: AllFareQuote;
    formRef2: React.MutableRefObject<any>;
};
const GSTForm = ({ fareQuotes, formRef2 }: Props) => {
    const dispatch = useDispatch();
    const {
        bookingData: { gstDetails },
        isGSTDetailsValid,
        selectedAirline,
        selectedInbountAirline,
    } = useAppSelector(state => state.reducer.airline);

    // FareQuote can come back with IsGSTMandatory=false even when the search result
    // flagged the fare as GST-mandatory (eg: corporate fares), so honour either source.
    const IsGSTMandatory = Boolean(
        fareQuotes.combined.IsGSTMandatory ||
            selectedAirline?.IsGSTMandatory ||
            selectedInbountAirline?.IsGSTMandatory
    );
    const GSTAllowed = Boolean(fareQuotes.combined.GSTAllowed || IsGSTMandatory);
    const [showGST, setShowGST] = useState<boolean>(IsGSTMandatory);

    useEffect(() => {
        if (IsGSTMandatory) setShowGST(true);
    }, [IsGSTMandatory]);

    const cleanAddressString = (input: string) => input.replace(/[^a-zA-Z0-9,\- ]/g, '');
    const cleanCompanyName = (input: string) => input.replace(/[^a-zA-Z0-9&. ]/g, '');

    useEffect(() => {
        if (!showGST) {
            dispatch(
                setGSTDetails({
                    GSTCompanyAddress: '',
                    GSTCompanyContactNumber: '',
                    GSTCompanyName: '',
                    GSTNumber: '',
                    GSTCompanyEmail: '',
                })
            );
        }
    }, [showGST, dispatch]);

    if (!GSTAllowed) return null;
    return (
        <Card
            size="small"
            className="md:py-4 md:px-7 border rounded-[28px] mt-6 w-full shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
        >
            <Row>
                <Col span={24} className="w-full mb-2">
                    <Flex className="items-center">
                        <Typography.Text className="text-[1.25rem] font-semibold leading-7 capitalize">
                            GST Information
                        </Typography.Text>
                        {IsGSTMandatory ? (
                            <Typography.Text className="text-gray-400 mx-1">
                                (Required)
                            </Typography.Text>
                        ) : (
                            <Typography.Text className="text-gray-400 mx-1">
                                (Optional)
                            </Typography.Text>
                        )}
                    </Flex>
                    {!IsGSTMandatory && (
                        <Flex className="mt-2 gap-2 items-center">
                            <Checkbox
                                onChange={e => setShowGST(e.target.checked)}
                                checked={showGST}
                            />
                            <Typography.Text
                                onClick={() => {
                                    setShowGST(!showGST);
                                }}
                                className="cursor-pointer"
                            >
                                Use GST details for this booking
                            </Typography.Text>
                        </Flex>
                    )}
                </Col>
            </Row>
            <Row className={`mt-4 ${!showGST && 'hidden'}`}>
                <Col span={24}>
                    <Row>
                        <Formik
                            initialValues={{
                                GSTCompanyAddress: gstDetails.GSTCompanyAddress || '',
                                GSTCompanyContactNumber: gstDetails.GSTCompanyContactNumber || '',
                                GSTCompanyName: gstDetails.GSTCompanyName || '',
                                GSTNumber: gstDetails.GSTNumber || '',
                                GSTCompanyEmail: gstDetails.GSTCompanyEmail || '',
                            }}
                            enableReinitialize
                            innerRef={formRef2}
                            validationSchema={GSTValidation(IsGSTMandatory)}
                            validateOnMount
                            onSubmit={async values => {
                                dispatch(setGSTDetails(values));
                            }}
                        >
                            {({ handleSubmit, isValid, setFieldValue, handleChange, values }) => {
                                if (isValid !== isGSTDetailsValid) {
                                    dispatch(
                                        setGSTDetailsValid({
                                            isGSTDetailsValid: isValid,
                                        })
                                    );
                                }
                                return (
                                    <Form
                                        onSubmit={handleSubmit}
                                       
                                        onBlur={() => {
                                            if (isValid) handleSubmit();
                                        }}
                                        autoComplete="off"
                                        className="w-full mt-5 "
                                    >
                                        <Row className="">
                                            <Col className="mr-10" xs={24} md={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        {IsGSTMandatory && (
                                                            <Typography.Text className="text-red-500 me-1">
                                                                *
                                                            </Typography.Text>
                                                        )}
                                                        GST Company Address
                                                    </Typography.Text>
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter GST Company Address"
                                                        name="GSTCompanyAddress"
                                                        classes="w-full"
                                                        allowedInputKeys={cleanAddressString}
                                                        isRequired
                                                        maxLength={50}
                                                    />
                                                </Flex>
                                            </Col>

                                            <Col className="mr-10" xs={24} md={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        {IsGSTMandatory && (
                                                            <Typography.Text className="text-red-500 me-1">
                                                                *
                                                            </Typography.Text>
                                                        )}
                                                        GST Company Contact Number
                                                    </Typography.Text>
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter GST Company Contact Number"
                                                        name="GSTCompanyContactNumber"
                                                        classes="w-full"
                                                        allowNumbersOnly
                                                        isRequired
                                                        maxLength={10}
                                                    />
                                                </Flex>
                                            </Col>

                                            <Col className="mr-10" xs={24} md={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        {IsGSTMandatory && (
                                                            <Typography.Text className="text-red-500 me-1">
                                                                *
                                                            </Typography.Text>
                                                        )}
                                                        GST Company Name
                                                    </Typography.Text>
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter GST Company Name"
                                                        name="GSTCompanyName"
                                                        classes="w-full"
                                                        allowedInputKeys={cleanCompanyName}
                                                        isRequired
                                                        maxLength={50}
                                                    />
                                                </Flex>
                                            </Col>

                                            <Col className="mr-10" xs={24} md={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        {IsGSTMandatory && (
                                                            <Typography.Text className="text-red-500 me-1">
                                                                *
                                                            </Typography.Text>
                                                        )}
                                                        GST Number
                                                    </Typography.Text>
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter GST Number"
                                                        name="GSTNumber"
                                                        classes="w-full"
                                                        allowAlphabetsSpaceAndNumbersOnly
                                                        handleChange={value => {
                                                            setFieldValue(
                                                                'GSTNumber',
                                                                value.toUpperCase()
                                                            );
                                                        }}
                                                        isRequired
                                                        maxLength={15}
                                                    />
                                                </Flex>
                                            </Col>

                                            <Col className="mr-10" xs={24} md={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        {IsGSTMandatory && (
                                                            <Typography.Text className="text-red-500 me-1">
                                                                *
                                                            </Typography.Text>
                                                        )}
                                                        GST Company Email
                                                    </Typography.Text>
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter GST Company Email"
                                                        name="GSTCompanyEmail"
                                                        classes="w-full"
                                                        isRequired
                                                        allowEmailsOnly
                                                        maxLength={50}
                                                    />
                                                </Flex>
                                            </Col>
                                        </Row>
                                    </Form>
                                );
                            }}
                        </Formik>
                    </Row>
                </Col>
            </Row>
        </Card>
    );
};

export default GSTForm;
