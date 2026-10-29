import { Flex, Form, Input, Select, Tooltip } from 'antd';

import {
    useEmailTemplateKeys,
    useEmailTemplateServices,
} from '../../../hooks/useEmailTemplateMetadata';
import usePartnersForCorporate from '../../../hooks/usePartnersForCorporate';

// Always keeps the record's current value selectable even if it's missing from the
// fetched list (e.g. stale data, or a value from a microservice not yet mirrored into
// officeAndBusiness's EMAIL_TEMPLATE_KEYS_BY_SERVICE) — so opening an existing
// template never shows a blank dropdown.
const toOptions = (values: string[], current: string) => {
    const all = current && !values.includes(current) ? [...values, current] : values;
    return all.map(value => ({ value, label: value }));
};

type TemplateDetailsFormProps = {
    name: string;
    onNameChange: (value: string) => void;
    templateKey: string;
    onKeyChange: (value: string) => void;
    isKeyEditable: boolean;
    service: string;
    onServiceChange: (value: string) => void;
    partnerId: string | number | null;
    onPartnerIdChange: (value: string | number | null) => void;
    subject: string;
    onSubjectChange: (value: string) => void;
    sender: string;
    onSenderChange: (value: string) => void;
};

const TemplateDetailsForm = ({
    name,
    onNameChange,
    templateKey,
    onKeyChange,
    isKeyEditable,
    service,
    onServiceChange,
    partnerId,
    onPartnerIdChange,
    subject,
    onSubjectChange,
    sender,
    onSenderChange,
}: TemplateDetailsFormProps) => {
    const { services, loading: servicesLoading } = useEmailTemplateServices();
    const { keys, loading: keysLoading } = useEmailTemplateKeys(service);
    const { partnerData } = usePartnersForCorporate('');

    return (
        <Form layout="vertical">
            <Flex wrap="wrap" gap={12}>
                <Form.Item
                    label="Template Name"
                    required
                    className="w-full sm:w-[calc(50%-6px)] !mb-3"
                >
                    <Input
                        value={name}
                        onChange={e => onNameChange(e.target.value)}
                        placeholder="e.g. Invoice Receipt"
                        maxLength={100}
                    />
                </Form.Item>
                <Form.Item label="Service" required className="w-full sm:w-[calc(50%-6px)] !mb-3">
                    <Select
                        value={service || undefined}
                        onChange={value => onServiceChange(value)}
                        options={toOptions(services, service)}
                        showSearch
                        optionFilterProp="label"
                        loading={servicesLoading}
                        placeholder="Select a service"
                    />
                </Form.Item>
                <Form.Item
                    label="Template Key"
                    required
                    className="w-full sm:w-[calc(50%-6px)] !mb-3"
                >
                    <Tooltip
                        title={
                            isKeyEditable
                                ? ''
                                : 'The template key cannot be changed after creation.'
                        }
                    >
                        <Select
                            value={templateKey || undefined}
                            onChange={value => onKeyChange(value)}
                            options={toOptions(keys, templateKey)}
                            showSearch
                            optionFilterProp="label"
                            loading={keysLoading}
                            disabled={!isKeyEditable || !service}
                            placeholder={
                                service ? 'Select a template key' : 'Select a service first'
                            }
                        />
                    </Tooltip>
                </Form.Item>
                <Form.Item label="Partner" className="w-full sm:w-[calc(50%-6px)] !mb-3">
                    <Select
                        // partnerId comes back from the API as a string; match it
                        // loosely so a saved template still resolves to its label.
                        value={partnerData.find(p => String(p.value) === String(partnerId))?.value}
                        onChange={value => onPartnerIdChange(value ?? null)}
                        options={partnerData}
                        showSearch
                        optionFilterProp="label"
                    />
                </Form.Item>
                <Form.Item label="Subject" required className="w-full sm:w-[calc(50%-6px)] !mb-3">
                    <Input
                        value={subject}
                        onChange={e => onSubjectChange(e.target.value)}
                        placeholder={`e.g. Invoice \${invoice_number} from \${company_name}`}
                        maxLength={200}
                    />
                </Form.Item>
                <Form.Item label="Sender" className="w-full sm:w-[calc(50%-6px)] !mb-0">
                    <Input
                        value={sender}
                        onChange={e => onSenderChange(e.target.value)}
                        placeholder="e.g. Peko <no-reply@peko.one>"
                        maxLength={200}
                    />
                </Form.Item>
            </Flex>
        </Form>
    );
};

export default TemplateDetailsForm;
