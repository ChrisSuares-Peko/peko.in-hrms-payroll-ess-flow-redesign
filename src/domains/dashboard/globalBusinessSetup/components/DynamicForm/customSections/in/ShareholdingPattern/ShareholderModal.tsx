/* eslint-disable no-nested-ternary */
import { useEffect, useMemo, useRef } from 'react';

import { Button, Col, Form, Modal, Radio, Row } from 'antd';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';

import { NATIONALITY_OPTS } from './constants';
import { Director, Shareholder } from './types';
import { isPhoneValidByCountry } from '../../../../../utils/isPhoneValid';
import PhoneInputWithCountry from '../../../../atomic/PhoneInputWithCountry';
import SelectInputWithSearchAndIcon from '../../../../atomic/SelectInputWithSearchAndIcon';

type Props = {
    isOpen: boolean;
    mode: 'add' | 'edit';
    instanceIdx: number;
    initial: Shareholder;
    others: Shareholder[];
    directors: Director[];
    directorLinkingConfigured: boolean;
    indianNationalityValue: string;
    onSave: (data: Omit<Shareholder, 'id'>) => void;
    onCancel: () => void;
};

type ModalFormValues = {
    isDirector: boolean;
    selectedDirectorKey: string;
    name: string;
    nationality: string;
    email: string;
    phone: string;
    pan: string;
};

const normPhone = (v: string) => v.replace(/\D/g, '');

// Same email format the page-level schema (generateYupSchema) enforces, so a
// value accepted here never fails the section's own validation afterwards.
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const buildSchema = (showDirectorOption: boolean, others: Shareholder[]) =>
    Yup.object({
        isDirector: Yup.boolean().required(),
        selectedDirectorKey: Yup.string().when(['isDirector'], ([isDir], s) =>
            isDir && showDirectorOption ? s.required('Please select a director') : s.optional()
        ),
        name: Yup.string().required('Name is required'),
        nationality: Yup.string().required('Nationality is required'),
        email: Yup.string()
            .required('Email is required')
            .matches(EMAIL_REGEX, 'Invalid email address')
            .test(
                'unique-email',
                'This email is already used by another shareholder',
                value =>
                    !value ||
                    !others.some(o => o.email && o.email.toLowerCase() === value.toLowerCase())
            ),
        phone: Yup.string()
            .required('Phone number is required')
            .test(
                'phone-required',
                'Phone number is required',
                value => !value || normPhone(value).length > 4
            )
            .test('is-phone', function isPhone(value) {
                if (!value || normPhone(value).length <= 4) return true;
                const { isValid, error } = isPhoneValidByCountry(value);

                return (
                    isValid || this.createError({ message: error ?? 'Phone number is invalid' })
                );
            })
            .test(
                'unique-phone',
                'This phone number is already used by another shareholder',
                value =>
                    !value || !others.some(o => o.phone && normPhone(o.phone) === normPhone(value))
            ),
        pan: Yup.string().when(['nationality'], ([nat], s) => {
            if (!nat) return s.optional();

            const withFormat =
                nat === 'Indian'
                    ? s
                          .required('PAN is required')
                          .matches(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, 'Invalid PAN (e.g. ABCDE1234F)')
                    : s
                          .required('Passport number is required')
                          .matches(
                              /^[A-Za-z0-9]{6,12}$/,
                              'Invalid passport number (6–12 letters/digits)'
                          );

            return withFormat.test(
                'unique-pan',
                nat === 'Indian'
                    ? 'This PAN is already used by another shareholder'
                    : 'This passport number is already used by another shareholder',
                value =>
                    !value || !others.some(o => o.pan && o.pan.toUpperCase() === value.toUpperCase())
            );
        }),
    });

type FieldsProps = {
    directors: Director[];
    indianNationalityValue: string;
    showDirectorOption: boolean;
};

function ModalFields({ directors, indianNationalityValue, showDirectorOption }: FieldsProps) {
    const { values, setFieldValue } = useFormikContext<ModalFormValues>();
    const { isDirector, nationality } = values;

    const prevIsDirector = useRef(isDirector);
    const prevNationality = useRef(nationality);

    // Switching between "is a director" and manual entry starts a fresh record.
    useEffect(() => {
        if (prevIsDirector.current === isDirector) return;
        prevIsDirector.current = isDirector;

        setFieldValue('selectedDirectorKey', '');
        setFieldValue('name', '');
        setFieldValue('nationality', '');
        setFieldValue('email', '');
        setFieldValue('phone', '');
        setFieldValue('pan', '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirector]);

    // The PAN/passport format depends on nationality — clear it on change
    // (except while a director prefill is populating both together).
    useEffect(() => {
        if (prevNationality.current === nationality) return;
        prevNationality.current = nationality;

        if (isDirector) return;

        setFieldValue('pan', '', false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nationality]);

    const handleDirectorSelect = (idx: number) => {
        const dir = directors[idx];

        if (!dir) return;

        setFieldValue('name', dir.name, false);

        let mappedNat = '';
        if (dir.nationality) {
            mappedNat =
                dir.nationality.toLowerCase() === indianNationalityValue ? 'Indian' : 'Foreign';
        }

        setFieldValue('nationality', mappedNat, false);

        if (dir.email) setFieldValue('email', dir.email, false);

        if (dir.phone) setFieldValue('phone', dir.phone, false);

        setFieldValue('pan', mappedNat === 'Indian' ? dir.pan || '' : '', false);
    };

    let panLabel = nationality === 'Indian' ? 'PAN' : 'Passport Number';

    if (!nationality) panLabel = 'PAN / Passport Number';

    const directorOptions = directors.map((d, i) => ({ label: d.name, value: String(i) }));

    return (
        <div className="space-y-2">
            {showDirectorOption && (
                <Form.Item label="Is this shareholder also a director?">
                    <Radio.Group
                        value={isDirector ? 'yes' : 'no'}
                        onChange={e => setFieldValue('isDirector', e.target.value === 'yes')}
                    >
                        <Radio value="no">No</Radio>
                        <Radio value="yes">Yes</Radio>
                    </Radio.Group>
                </Form.Item>
            )}

            <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                    {isDirector ? (
                        directors.length === 0 ? (
                            <div className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                <p className="text-xs font-medium text-amber-700">
                                    No directors found
                                </p>
                                <p className="text-xs text-amber-600">
                                    Please fill in the director details in the previous section
                                    first.
                                </p>
                            </div>
                        ) : (
                            <SelectInputWithSearchAndIcon
                                isRequired
                                label="Shareholder Name"
                                name="selectedDirectorKey"
                                options={directorOptions}
                                placeholder="Select a director"
                                handleChange={value => {
                                    if (value === undefined || value === null || value === '')
                                        return;
                                    handleDirectorSelect(parseInt(String(value), 10));
                                }}
                            />
                        )
                    ) : (
                        <TextInput
                            isRequired
                            label="Shareholder Name"
                            name="name"
                            placeholder="Please enter"
                            type="text"
                        />
                    )}
                </Col>

                <Col xs={24} md={12}>
                    <SelectInputWithSearchAndIcon
                        isRequired
                        label="Nationality"
                        name="nationality"
                        options={NATIONALITY_OPTS}
                        placeholder="Please select"
                    />
                </Col>

                <Col xs={24} md={12}>
                    <TextInput
                        isRequired
                        label="Email Address"
                        name="email"
                        placeholder="Please enter"
                        type="email"
                    />
                </Col>
                <Col xs={24} md={12}>
                    <PhoneInputWithCountry
                        isRequired
                        defaultCountry="IN"
                        label="Mobile Number"
                        name="phone"
                    />
                </Col>

                {nationality && (
                    <Col xs={24} md={12}>
                        <TextInput
                            isRequired
                            label={panLabel}
                            name="pan"
                            placeholder="Please enter"
                            type="text"
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
}

export default function ShareholderModal({
    isOpen,
    mode,
    instanceIdx,
    initial,
    others,
    directors,
    directorLinkingConfigured,
    indianNationalityValue,
    onSave,
    onCancel,
}: Props) {
    const showDirectorOption = directorLinkingConfigured;

    const initialDirectorIdx = initial.isDirector
        ? directors.findIndex(d => d.name === initial.name)
        : -1;

    const schema = useMemo(
        () => buildSchema(showDirectorOption, others),
        [showDirectorOption, others]
    );

    const isEditing = mode === 'edit' || !!(initial.email || initial.sharePercent || initial.pan);

    const initialValues: ModalFormValues = {
        isDirector: !!initial.isDirector && showDirectorOption,
        selectedDirectorKey: initialDirectorIdx >= 0 ? String(initialDirectorIdx) : '',
        name: initial.name,
        nationality: initial.nationality || '',
        email: initial.email,
        phone: initial.phone,
        pan: initial.pan || '',
    };

    const handleSubmit = (data: ModalFormValues) => {
        const isDir = data.isDirector && showDirectorOption;
        const nat = data.nationality || '';
        const isIndian = nat === 'Indian';

        onSave({
            name: data.name.trim().replace(/\s+/g, ' '),
            nationality: nat,
            email: data.email,
            phone: data.phone,
            pan: isIndian ? (data.pan || '').toUpperCase() : data.pan || '',
            sharePercent: initial.sharePercent,
            isDirector: isDir,
        });
    };

    return (
        <Formik<ModalFormValues>
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={handleSubmit}
        >
            {({ submitForm }) => (
                <Modal
                    open={isOpen}
                    onCancel={onCancel}
                    title={`${isEditing ? 'Edit' : 'Add'} Shareholder ${instanceIdx + 1}`}
                    width={1000}
                    maskClosable={false}
                    footer={[
                        <Button key="cancel" onClick={onCancel} danger>
                            Cancel
                        </Button>,
                        <Button danger key="save" type="primary" onClick={submitForm}>
                            {isEditing ? 'Update' : 'Add'}
                        </Button>,
                    ]}
                >
                    <Form layout="vertical" component="div">
                        <ModalFields
                            directors={directors}
                            indianNationalityValue={indianNationalityValue}
                            showDirectorOption={showDirectorOption}
                        />
                    </Form>
                </Modal>
            )}
        </Formik>
    );
}
