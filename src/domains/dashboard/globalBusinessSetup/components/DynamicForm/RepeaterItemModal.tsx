import React from 'react';

import { Button, Col, Form, Modal, Row } from 'antd';
import { useFormikContext } from 'formik';

import { getCustomSectionEntry } from './customSections/registry';
import FieldRenderer from './FieldRenderer';
import { IForm, ISection } from '../../types/forms';
import { evaluateCondition } from '../../utils/conditionalUtils';
import { getValueFromComplexPath } from '../../utils/pathResolver';

interface RepeaterItemModalProps {
    open: boolean;
    mode: 'add' | 'edit';
    noun: string;
    // Optional instance label (from repeater.label_field_name).
    label?: string;
    section: ISection;
    pageId: string;
    sectionId: string;
    instanceIdx: number;
    form: IForm;
    onSave: () => void;
    onCancel: () => void;
}

const RepeaterItemModal: React.FC<RepeaterItemModalProps> = ({
    open,
    mode,
    noun,
    label,
    section,
    pageId,
    sectionId,
    instanceIdx,
    form,
    onSave,
    onCancel,
}) => {
    const { values } = useFormikContext<any>();

    // Custom repeater section: the item modal hosts the section's own component
    // bound to this instance's path, instead of the generic field grid.
    const customEntry =
        section.section_type === 'custom'
            ? getCustomSectionEntry(section.component_key)
            : undefined;

    const visibleFields = section.fields.filter(field => {
        if (!field.conditional?.enabled || !field.conditional.source_field_name) return true;
        const sourceValue = getValueFromComplexPath(
            form,
            values,
            field.conditional.source_field_name,
            pageId,
            sectionId,
            instanceIdx
        );
        if (sourceValue === undefined || sourceValue === null) return false;
        if (!field.conditional.operator) return false;
        return evaluateCondition(sourceValue, field.conditional.operator, field.conditional.value);
    });

    const isSingleColumn = visibleFields.length <= 4;
    const colSpan = isSingleColumn ? 24 : 12;

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={`${mode === 'add' ? 'Add' : 'Edit'} ${noun} ${instanceIdx + 1}${label ? ` - ${label}` : ''}`}
            width={customEntry?.Render || !isSingleColumn ? 1000 : 640}
            maskClosable={false}
            footer={[
                <Button key="cancel" onClick={onCancel} danger>
                    Cancel
                </Button>,
                <Button danger key="save" type="primary" onClick={onSave}>
                    {mode === 'add' ? 'Add' : 'Update'}
                </Button>,
            ]}
        >
            {customEntry?.Render ? (
                <customEntry.Render
                    config={section.component_config || {}}
                    form={form}
                    instancePath={`pages.${pageId}.${sectionId}.${instanceIdx}`}
                    section={section}
                />
            ) : (
                <Form layout="vertical" component="div">
                    <Row gutter={[16, 0]}>
                        {visibleFields.map((field, index) => {
                            const isLastAlone =
                                !isSingleColumn &&
                                field.type === 'textarea' &&
                                index === visibleFields.length - 1 &&
                                visibleFields.length % 2 !== 0;
                            const isFullWidth =
                                field.type === 'checkbox' ||
                                field.type === 'nested_select' ||
                                field.type === 'table' ||
                                isLastAlone;
                            return (
                                <Col key={field._id} xs={24} md={isFullWidth ? 24 : colSpan}>
                                    <FieldRenderer
                                        field={field}
                                        pageId={pageId}
                                        sectionId={sectionId}
                                        instanceIdx={instanceIdx}
                                        form={form}
                                    />
                                </Col>
                            );
                        })}
                    </Row>
                </Form>
            )}
        </Modal>
    );
};

export default RepeaterItemModal;
