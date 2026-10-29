import { Alert, Col, Form, Radio, Row } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

import { NATIONALITY_OPTS, SH } from './constants';
import DirectorSelect, { DirectorPrefill } from './DirectorSelect';
import { computeShares, useShareholdingPattern } from './useShareholdingPattern';
import PhoneInputWithCountry from '../../../../atomic/PhoneInputWithCountry';
import SelectInputWithSearchAndIcon from '../../../../atomic/SelectInputWithSearchAndIcon';
import { CustomSectionRenderProps } from '../../types';
import { useCustomSectionFields } from '../../useCustomSectionFields';

/**
 * Repeater mode: one shareholder's form, rendered inside the standard repeater
 * item modal (SectionRenderer → RepeatableSection → RepeaterItemModal). The
 * `instancePath` already ends in `.{idx}`, so inputs bind straight to that
 * instance's flat field paths (`${instancePath}.${fieldName}`) via Formik — the
 * modal's Add/Update (validateForm) and Cancel (snapshot restore) work
 * unchanged. Per-field validation comes from the section field specs (see
 * constants) through the engine's generateYupSchema.
 */
export default function ShareholderInstanceForm(props: CustomSectionRenderProps) {
    const { section } = props;
    // A form published with an older spec may lack some fields — surface it so
    // the section gets re-saved in the builder rather than storing partial data.
    const missing = Object.values(SH).some(name => !section.fields.some(f => f.name === name));

    if (missing) {
        return (
            <Alert
                type="warning"
                showIcon
                message="This section's fields are out of date — re-save the section in the form builder."
            />
        );
    }

    return <InstanceFields {...props} />;
}

function InstanceFields({ section, instancePath, config }: CustomSectionRenderProps) {
    const { directors, directorLinkingConfigured, indianNationalityValue, paidUpShares } =
        useShareholdingPattern(section, instancePath, config);
    const { get, set } = useCustomSectionFields(section, instancePath);

    const name = String(get(SH.name) ?? '');
    const nationality = String(get(SH.nationality) ?? '');
    const isDirector = get(SH.isDirector) === true || get(SH.isDirector) === 'true';
    const sharePercent = Number(get(SH.sharePercent) ?? 0) || 0;

    const path = (field: string) => `${instancePath}.${field}`;

    const clearPersonFields = () => {
        [SH.name, SH.nationality, SH.email, SH.phone, SH.pan].forEach(field => set(field, ''));
    };

    const handleDirectorSelect = (prefill: DirectorPrefill) => {
        set(SH.name, prefill.name);
        set(SH.nationality, prefill.nationality);
        if (prefill.email) set(SH.email, prefill.email);
        if (prefill.phone) set(SH.phone, prefill.phone);
        set(SH.pan, prefill.pan);
    };

    const selectedDirectorIdx = isDirector ? directors.findIndex(d => d.name === name) : -1;

    let panLabel = nationality === 'Indian' ? 'PAN' : 'Passport Number';
    if (!nationality) panLabel = 'PAN / Passport Number';

    const allottedShares = paidUpShares ? computeShares(sharePercent, paidUpShares) : null;

    return (
        <Form layout="vertical" component="div">
            <div className="space-y-2">
                {directorLinkingConfigured && (
                    <Form.Item label="Is this shareholder also a director?">
                        <Radio.Group
                            value={isDirector ? 'yes' : 'no'}
                            onChange={e => {
                                set(SH.isDirector, e.target.value === 'yes');
                                clearPersonFields();
                            }}
                        >
                            <Radio value="no">No</Radio>
                            <Radio value="yes">Yes</Radio>
                        </Radio.Group>
                    </Form.Item>
                )}

                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        {isDirector ? (
                            <DirectorSelect
                                directors={directors}
                                indianNationalityValue={indianNationalityValue}
                                selectedIdx={selectedDirectorIdx}
                                onSelect={handleDirectorSelect}
                            />
                        ) : (
                            <TextInput
                                isRequired
                                label="Shareholder Name"
                                name={path(SH.name)}
                                placeholder="Please enter"
                                type="text"
                            />
                        )}
                    </Col>

                    <Col xs={24} md={12}>
                        <SelectInputWithSearchAndIcon
                            isRequired
                            label="Nationality"
                            name={path(SH.nationality)}
                            options={NATIONALITY_OPTS}
                            placeholder="Please select"
                        />
                    </Col>

                    <Col xs={24} md={12}>
                        <TextInput
                            isRequired
                            label="Email Address"
                            name={path(SH.email)}
                            placeholder="Please enter"
                            type="email"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <PhoneInputWithCountry
                            isRequired
                            defaultCountry="IN"
                            label="Mobile Number"
                            name={path(SH.phone)}
                        />
                    </Col>

                    {nationality && (
                        <Col xs={24} md={12}>
                            <TextInput
                                isRequired
                                label={panLabel}
                                name={path(SH.pan)}
                                placeholder="Please enter"
                                type="text"
                            />
                        </Col>
                    )}

                    <Col xs={24} md={12}>
                        <TextInput
                            isRequired
                            allowDecimalsOnly
                            label="% Holding"
                            name={path(SH.sharePercent)}
                            placeholder="e.g. 50"
                            type="text"
                        />
                        {allottedShares !== null && paidUpShares && (
                            <p className="-mt-2 text-xs text-gray-400">
                                {allottedShares} of {paidUpShares} shares
                            </p>
                        )}
                    </Col>
                </Row>
            </div>
        </Form>
    );
}
