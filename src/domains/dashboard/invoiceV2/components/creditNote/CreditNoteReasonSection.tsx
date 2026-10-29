import { Col, Form, Input, Row, Select } from 'antd';
import { getIn, useFormikContext } from 'formik';

import { CreateInvoiceFormValues } from '../../types/createInvoice';
import { CREDIT_NOTE_REASON_OPTIONS } from '../../utils/constants/creditNote';

const CreditNoteReasonSection = () => {
    const { values, errors, touched, setFieldValue, setFieldTouched } =
        useFormikContext<CreateInvoiceFormValues>();

    const reasonError =
        getIn(touched, 'creditNote.reason') && getIn(errors, 'creditNote.reason')
            ? getIn(errors, 'creditNote.reason')
            : undefined;

    const handleReasonChange = (val: string) => {
        setFieldValue('creditNote.reason', val);
        setFieldTouched('creditNote.reason', true, false);
    };

    const handleReasonDetailChange = (val: string) => {
        setFieldValue('creditNote.reasonDetail', val);
    };

    return (
        <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Credit Note Details
            </span>
            <Form layout="vertical" className="w-full">
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label={<span>Reason <span className="text-red-500">*</span></span>}
                            validateStatus={reasonError ? 'error' : ''}
                            help={reasonError}
                            className="mb-2.5"
                        >
                            <Select
                                value={values.creditNote?.reason || undefined}
                                onChange={handleReasonChange}
                                options={CREDIT_NOTE_REASON_OPTIONS}
                                placeholder="Select reason"
                                className="w-full"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Additional Detail"
                            className="mb-2.5"
                        >
                            <Input.TextArea
                                value={values.creditNote?.reasonDetail || ''}
                                onChange={e => handleReasonDetailChange(e.target.value)}
                                placeholder="Describe the reason in more detail..."
                                maxLength={80}
                                rows={1}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default CreditNoteReasonSection;
