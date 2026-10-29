import { Flex, Form, Input, Select } from 'antd';

import usePartnersForCorporate from '../../../hooks/usePartnersForCorporate';
import { EmailLayoutType } from '../../../types/emailLayout';

type LayoutDetailsFormProps = {
    name: string;
    onNameChange: (value: string) => void;
    type: EmailLayoutType | '';
    onTypeChange: (value: EmailLayoutType) => void;
    partnerId: string | number | null;
    onPartnerIdChange: (value: string | number | null) => void;
};

const LayoutDetailsForm = ({
    name,
    onNameChange,
    type,
    onTypeChange,
    partnerId,
    onPartnerIdChange,
}: LayoutDetailsFormProps) => {
    const { partnerData } = usePartnersForCorporate('');

    return (
        <Form layout="vertical">
            <Flex wrap="wrap" gap={12}>
                <Form.Item
                    label="Layout Name"
                    required
                    className="w-full sm:w-[calc(50%-6px)] !mb-3"
                >
                    <Input
                        value={name}
                        onChange={e => onNameChange(e.target.value)}
                        placeholder="e.g. Default Header"
                        maxLength={150}
                    />
                </Form.Item>
                <Form.Item label="Type" required className="w-full sm:w-[calc(50%-6px)] !mb-3">
                    <Select
                        value={type || undefined}
                        onChange={value => onTypeChange(value)}
                        options={[
                            { value: 'HEADER', label: 'Header' },
                            { value: 'FOOTER', label: 'Footer' },
                        ]}
                        placeholder="Select a type"
                    />
                </Form.Item>
                <Form.Item label="Partner" className="w-full sm:w-[calc(50%-6px)] !mb-0">
                    <Select
                        value={partnerId}
                        onChange={value => onPartnerIdChange(value ?? null)}
                        options={partnerData}
                        showSearch
                        optionFilterProp="label"
                    />
                </Form.Item>
            </Flex>
        </Form>
    );
};

export default LayoutDetailsForm;
