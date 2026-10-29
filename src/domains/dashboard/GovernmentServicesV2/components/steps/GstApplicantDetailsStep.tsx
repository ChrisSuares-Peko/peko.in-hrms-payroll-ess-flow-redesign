import { useState } from 'react';

import { Button, Col, Flex, Form, Row, Typography } from 'antd';
import { FieldArray, FormikErrors } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import AuthorizedPersonModal from './AuthorizedPersonModal';
import { GstApplicationValues, GstAuthorizedPerson } from '../../types';
import { GST_SALUTATION_OPTIONS, requiresCinDoi } from '../../utils/gstForm';

const { Text } = Typography;

// GST_Registration.pdf §E4 — Applicant Type (9 fixed options).
const APPLICANT_TYPE_OPTIONS = [
    'Taxpayer',
    'Tax Deductor',
    'Tax Collector (e-Commerce)',
    'GST Practitioner',
    'Non Resident Taxable Person',
    'United Nation Body',
    'Consulate or Embassy of Foreign Country',
    'Other Notified Person',
    'Non-Resident Online Services Provider',
].map(option => ({ label: option, value: option }));

// GST_Registration.pdf §E4 — Nature of possession of premises (6 fixed options).
const PREMISES_OPTIONS = ['Consent', 'Leased', 'Others', 'Own', 'Rented', 'Shared'].map(option => ({
    label: option,
    value: option,
}));

// Read-only preview rows for the currently-selected Authorized Person — editing happens only via
// AuthorizedPersonModal, never inline here (per the confirmed design).
const PREVIEW_FIELDS: [string, keyof Omit<GstAuthorizedPerson, 'key'>][] = [
    ['Salutation', 'salutation'],
    ['Full Name', 'fullName'],
    ['PAN Number', 'pan'],
    ['Date of Birth', 'dob'],
    ['Mobile Number', 'mobile'],
    ['Email', 'email'],
    ['Relationship', 'relationship'],
];

interface GstApplicantDetailsStepProps {
    values: GstApplicationValues;
}

// Step 1: Applicant Type, Premises, Business Name (prefilled), Salutation, PAN, Mobile, Email, the
// Authorized Persons list (below), and the entity-type-conditional CIN/LLPIN + Date of
// Incorporation (§E1) — hidden and never validated for Proprietorship/Individual/Trust/Partnership.
const GstApplicantDetailsStep = ({ values }: GstApplicantDetailsStepProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // null = "Add" mode; a person's own key = "Edit" mode, editing that specific person.
    const [editingKey, setEditingKey] = useState<string | null>(null);

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
            <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="applicantType"
                        label="Applicant Type"
                        placeholder="Select applicant type"
                        classes="h-10"
                        isRequired
                        options={APPLICANT_TYPE_OPTIONS}
                        showSearch
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="premises"
                        label="Nature of possession of premises"
                        placeholder="Select"
                        classes="h-10"
                        isRequired
                        options={PREMISES_OPTIONS}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="businessName"
                        label="Business Name"
                        type="text"
                        classes="h-10"
                        isRequired
                        isDisabled
                        placeholder="Prefilled from the Business API"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="salutation"
                        label="Salutation"
                        placeholder="Select"
                        classes="h-10"
                        isRequired
                        options={GST_SALUTATION_OPTIONS}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="pan"
                        label="PAN Number"
                        type="text"
                        classes="h-10"
                        isRequired
                        maxLength={10}
                        convertToUppercase
                        placeholder="e.g., ABCDE1234F"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="mobileNumber"
                        label="Mobile Number"
                        type="text"
                        classes="h-10"
                        isRequired
                        allowNumbersOnly
                        maxLength={10}
                        placeholder="e.g., 9876543210"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="email"
                        label="Email"
                        type="text"
                        classes="h-10"
                        isRequired
                        placeholder="e.g., joseph@example.com"
                    />
                </Col>
                {requiresCinDoi(values.entityType) && (
                    <>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="cin"
                                label="CIN/LLPIN"
                                type="text"
                                classes="h-10"
                                isRequired
                                convertToUppercase
                                placeholder="Enter the CIN/LLPIN"
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <DatePickerInput
                                name="doi"
                                label="Date of Incorporation"
                                placeholder="Select date of incorporation"
                                isRequired
                            />
                        </Col>
                    </>
                )}
            </Row>

            <FieldArray name="authorizedPersons">
                {({ push, remove, form }) => {
                    const persons = (form.values as GstApplicationValues).authorizedPersons;
                    const errors = (form.errors as FormikErrors<GstApplicationValues>)
                        .authorizedPersons;
                    const selectedKey = (form.values as GstApplicationValues)
                        .primaryAuthorizedPersonKey;
                    const selectedIndex = persons.findIndex(person => person.key === selectedKey);
                    const selectedPerson = selectedIndex >= 0 ? persons[selectedIndex] : undefined;
                    const editingPerson =
                        editingKey !== null
                            ? persons.find(person => person.key === editingKey)
                            : undefined;

                    // Selecting a person from the dropdown IS marking them primary — one action, per
                    // the confirmed design: whichever person is picked here becomes the singular
                    // authorized_person/authorized_person_id at filing time, while every person in
                    // the list (selected or not) still goes to the vendor in partner_details[].
                    const selectPerson = (key: string) => {
                        form.setFieldValue('primaryAuthorizedPersonKey', key);
                    };

                    const openAddModal = () => {
                        setEditingKey(null);
                        setIsModalOpen(true);
                    };

                    const openEditModal = () => {
                        if (!selectedPerson) return;
                        setEditingKey(selectedPerson.key);
                        setIsModalOpen(true);
                    };

                    const closeModal = () => setIsModalOpen(false);

                    // Add mode pushes a brand-new person and selects them immediately (otherwise
                    // there'd be no way to reach them); edit mode replaces the existing entry
                    // in place, keeping its key and its position in the dropdown/list.
                    const handleModalSubmit = (personValues: Omit<GstAuthorizedPerson, 'key'>) => {
                        if (editingKey !== null) {
                            const index = persons.findIndex(person => person.key === editingKey);
                            if (index >= 0) {
                                form.setFieldValue(`authorizedPersons.${index}`, {
                                    key: editingKey,
                                    ...personValues,
                                });
                            }
                            return;
                        }
                        const key = crypto.randomUUID();
                        push({ key, ...personValues });
                        selectPerson(key);
                    };

                    const removeSelectedPerson = () => {
                        if (selectedIndex < 0) return;
                        remove(selectedIndex);
                        // Falls back to whichever person is left first, or clears if none remain
                        // (the step's own Yup schema blocks Next until at least one exists again).
                        const remaining = persons.filter((_, i) => i !== selectedIndex);
                        form.setFieldValue('primaryAuthorizedPersonKey', remaining[0]?.key ?? '');
                    };

                    return (
                        <Flex vertical gap={16} className="mt-4">
                            <Text strong className="text-sm">
                                Authorized Persons
                            </Text>

                            <Flex gap={12} align="flex-end" wrap="wrap">
                                <div className="flex-1 min-w-[220px]">
                                    <SelectInput
                                        name="primaryAuthorizedPersonKey"
                                        label="Authorized Person (used for this GST filing)"
                                        placeholder="Select a person"
                                        classes="h-10"
                                        isRequired
                                        handleChange={selectPerson}
                                        options={persons.map((person, index) => ({
                                            label: person.fullName || `Person ${index + 1}`,
                                            value: person.key,
                                        }))}
                                    />
                                </div>
                                <Button onClick={openAddModal} className="!h-10 !mb-3">
                                    + Add Person
                                </Button>
                            </Flex>
                            {typeof errors === 'string' && (
                                <Text type="danger" className="text-xs">
                                    {errors}
                                </Text>
                            )}

                            {selectedPerson && (
                                <div
                                    className="p-4 rounded-lg"
                                    style={{ border: '1px solid #F0F0F0' }}
                                >
                                    <Flex justify="space-between" align="center" className="mb-3">
                                        <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                                            Person {selectedIndex + 1} of {persons.length}
                                        </Text>
                                        <Flex gap={8}>
                                            <Button
                                                type="text"
                                                size="small"
                                                onClick={openEditModal}
                                            >
                                                Edit
                                            </Button>
                                            {persons.length > 1 && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    onClick={removeSelectedPerson}
                                                >
                                                    Remove this person
                                                </Button>
                                            )}
                                        </Flex>
                                    </Flex>
                                    <Row gutter={[16, 8]}>
                                        {PREVIEW_FIELDS.map(([label, field]) => (
                                            <Col xs={24} sm={12} key={field}>
                                                <Text
                                                    className="block text-xs"
                                                    style={{ color: '#8C8C8C' }}
                                                >
                                                    {label}
                                                </Text>
                                                <Text className="block text-sm" strong>
                                                    {selectedPerson[field] || '--'}
                                                </Text>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            <AuthorizedPersonModal
                                open={isModalOpen}
                                initialValues={
                                    editingPerson
                                        ? {
                                              salutation: editingPerson.salutation,
                                              fullName: editingPerson.fullName,
                                              pan: editingPerson.pan,
                                              dob: editingPerson.dob,
                                              mobile: editingPerson.mobile,
                                              email: editingPerson.email,
                                              relationship: editingPerson.relationship,
                                          }
                                        : null
                                }
                                onClose={closeModal}
                                onSubmit={handleModalSubmit}
                            />
                        </Flex>
                    );
                }}
            </FieldArray>
        </Form>
    );
};

export default GstApplicantDetailsStep;
