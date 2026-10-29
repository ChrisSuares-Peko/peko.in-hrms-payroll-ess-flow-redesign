import { Col, Form, Row, Typography } from 'antd';
import { FormikErrors } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { GstJurisdictionOption } from '../../apis';
import { GstApplicationValues } from '../../types';
import { isMaharashtra } from '../../utils/gstForm';

const { Text } = Typography;

// GST_Registration.pdf's Maharashtra-only conditional fields — confirmed exact list.
const ELECTRICITY_BOARD_OPTIONS = [
    'Adani Electricity Mumbai Limited',
    'Maharashtra State Electricity Distribution Co. Ltd',
    'Tata Power',
    'The Brihanmumbai Electric Supply and Transport Undertaking',
    'Torrent Power Limited',
].map(option => ({ label: option, value: option }));

interface GstAddressDetailsStepProps {
    values: GstApplicationValues;
    setFieldValue: (
        field: string,
        value: unknown,
        shouldValidate?: boolean
    ) => Promise<void | FormikErrors<GstApplicationValues>>;
    statesOptions: { label: string; value: string }[];
    circleOptions: GstJurisdictionOption[];
    commissionerateOptions: GstJurisdictionOption[];
    divisionOptions: GstJurisdictionOption[];
    rangeOptions: GstJurisdictionOption[];
    isLookingUpJurisdiction: boolean;
    onPincodeChange: (pincode: string) => void;
}

// Step 2: GST Applying State, District (read-only, from the jurisdiction lookup), Pincode (drives
// the lookup on 6 digits), Circle/Commissionerate/Division/Range (populated from the lookup, one
// pair of name+id fields each — see types/index.ts), Address, and the Maharashtra-only Electricity
// Board / CA Number pair (GST_Registration.pdf §E4/§E6).
const GstAddressDetailsStep = ({
    values,
    setFieldValue,
    statesOptions,
    circleOptions,
    commissionerateOptions,
    divisionOptions,
    rangeOptions,
    isLookingUpJurisdiction,
    onPincodeChange,
}: GstAddressDetailsStepProps) => {
    // Each jurisdiction SelectInput is bound to the *_id field (what the Smart Form actually
    // needs); its handleChange also writes the matching display name into the sibling plain field.
    const makeJurisdictionHandler =
        (nameField: string, options: GstJurisdictionOption[]) => (id: string) => {
            const matched = options.find(opt => opt.value === id);
            setFieldValue(nameField, matched?.label ?? '');
        };

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
            <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="gstApplyingState"
                        label="GST Applying State"
                        placeholder="Select state"
                        classes="h-10"
                        isRequired
                        showSearch
                        options={statesOptions}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="pincode"
                        label="Pincode"
                        type="text"
                        classes="h-10"
                        isRequired
                        allowNumbersOnly
                        maxLength={6}
                        placeholder="e.g., 110001"
                        handleChange={onPincodeChange}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="district"
                        label="District"
                        type="text"
                        classes="h-10"
                        isRequired
                        isDisabled
                        placeholder="Auto-filled from pincode"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="circleId"
                        label="Circle"
                        placeholder={
                            isLookingUpJurisdiction ? 'Looking up…' : 'Enter pincode first'
                        }
                        classes="h-10"
                        isRequired
                        isDisabled={circleOptions.length === 0}
                        options={circleOptions}
                        handleChange={makeJurisdictionHandler('circle', circleOptions)}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="commissionerateId"
                        label="Commissionerate"
                        placeholder={
                            isLookingUpJurisdiction ? 'Looking up…' : 'Enter pincode first'
                        }
                        classes="h-10"
                        isRequired
                        isDisabled={commissionerateOptions.length === 0}
                        options={commissionerateOptions}
                        handleChange={makeJurisdictionHandler(
                            'commissionerate',
                            commissionerateOptions
                        )}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="divisionId"
                        label="Division"
                        placeholder={
                            isLookingUpJurisdiction ? 'Looking up…' : 'Enter pincode first'
                        }
                        classes="h-10"
                        isRequired
                        isDisabled={divisionOptions.length === 0}
                        options={divisionOptions}
                        handleChange={makeJurisdictionHandler('division', divisionOptions)}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="rangeId"
                        label="Range"
                        placeholder={
                            isLookingUpJurisdiction ? 'Looking up…' : 'Enter pincode first'
                        }
                        classes="h-10"
                        isRequired
                        isDisabled={rangeOptions.length === 0}
                        options={rangeOptions}
                        handleChange={makeJurisdictionHandler('range', rangeOptions)}
                    />
                </Col>
                <Col xs={24}>
                    <TextAreaInput
                        name="address"
                        label="Address"
                        placeholder="Enter the PPOB address"
                        isRequired
                        minRows={3}
                    />
                </Col>
                {isMaharashtra(values.gstApplyingState) && (
                    <>
                        <Col xs={24} sm={12}>
                            <SelectInput
                                name="electricityBoard"
                                label="Electricity Board"
                                placeholder="Select electricity board"
                                classes="h-10"
                                isRequired
                                options={ELECTRICITY_BOARD_OPTIONS}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="caNumber"
                                label="CA Number"
                                type="text"
                                classes="h-10"
                                isRequired
                                placeholder="Enter the CA number"
                            />
                        </Col>
                    </>
                )}
            </Row>
            {circleOptions.length > 1 ||
            commissionerateOptions.length > 1 ||
            divisionOptions.length > 1 ||
            rangeOptions.length > 1 ? (
                <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                    Multiple jurisdiction options were found for this pincode — please pick the
                    correct one for each field.
                </Text>
            ) : null}
        </Form>
    );
};

export default GstAddressDetailsStep;
