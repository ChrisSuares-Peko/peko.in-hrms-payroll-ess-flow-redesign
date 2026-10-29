import React, { useMemo } from 'react';

import { CalendarOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Col, Modal, Row, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import FieldValue from './FieldValue';
import { useCountries } from '../../hooks/useCountries';
import { ISection } from '../../types/forms';

interface RepeaterViewModalProps {
    open: boolean;
    noun: string;
    section: ISection;
    pageId: string;
    sectionId: string;
    instanceIdx: number;
    onClose: () => void;
}

const fieldIcon = (type: string) => {
    if (type === 'date') return <CalendarOutlined style={{ color: '#9CA3AF', marginRight: 4 }} />;
    if (type === 'email') return <MailOutlined style={{ color: '#9CA3AF', marginRight: 4 }} />;
    if (type === 'phone') return <PhoneOutlined style={{ color: '#9CA3AF', marginRight: 4 }} />;
    return null;
};

const RepeaterViewModal: React.FC<RepeaterViewModalProps> = ({
    open,
    noun,
    section,
    pageId,
    sectionId,
    instanceIdx,
    onClose,
}) => {
    const { values } = useFormikContext<any>();

    const instanceValues = useMemo(
        () => getIn(values, `pages.${pageId}.${sectionId}.${instanceIdx}`) || {},
        [values, pageId, sectionId, instanceIdx]
    );

    const hasAnyData = useMemo(
        () =>
            section.fields.some(field => {
                const val = instanceValues[field.name];
                if (val === undefined || val === null || val === '' || val === false) return false;
                if (field.type === 'phone' && (val === '+91' || val === '+971')) return false;
                if (Array.isArray(val) && val.length === 0) return false;
                return true;
            }),
        [instanceValues, section.fields]
    );

    const hasCountryField = useMemo(
        () => section.fields.some(f => f.type === 'country'),
        [section.fields]
    );
    const { countryOptions } = useCountries('', '', hasCountryField ? 'is_active=true' : '');
    const countryLabelById = useMemo(() => {
        const map: Record<string, string> = {};
        countryOptions.forEach(c => {
            map[c.value] = c.label;
        });
        return map;
    }, [countryOptions]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={`${noun} Details`}
            width={640}
            centered
            maskClosable
            styles={{
                content: { borderRadius: 20, padding: '28px 32px' },
                header: { marginBottom: 20 },
            }}
            footer={[
                <Button key="cancel" onClick={onClose} danger>
                    Cancel
                </Button>,
            ]}
        >
            {!hasAnyData ? (
                <Typography.Text
                    type="secondary"
                    style={{ display: 'block', textAlign: 'center', padding: '24px 0' }}
                >
                    No details entered yet.
                </Typography.Text>
            ) : (
                <Row gutter={[24, 20]} style={{ marginTop: 8 }}>
                    {section.fields.map(field => {
                        let value = instanceValues[field.name];

                        if (
                            value === undefined ||
                            value === null ||
                            value === '' ||
                            value === false
                        )
                            return null;
                        if (field.type === 'phone' && (value === '+91' || value === '+971')) return null;
                        if (Array.isArray(value) && value.length === 0) return null;

                        if (field.type === 'country' && value) {
                            value = countryLabelById[String(value)] ?? value;
                        }

                        return (
                            <Col key={field._id} xs={24} sm={12}>
                                <Typography.Text
                                    type="secondary"
                                    style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                                >
                                    {field.label}
                                </Typography.Text>
                                <Typography.Text style={{ fontSize: 14 }}>
                                    {fieldIcon(field.type)}
                                    <FieldValue field={field} value={value} />
                                </Typography.Text>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Modal>
    );
};

export default RepeaterViewModal;
