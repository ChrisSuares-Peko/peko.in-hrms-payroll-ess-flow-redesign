import React, { useState } from 'react';

import {
    DownOutlined,
    MailOutlined,
    SaveOutlined,
    UpOutlined,
    WhatsAppOutlined,
} from '@ant-design/icons';
import { Button, Flex, Grid, Input, Select, Switch, Tag } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { TIMING_OPTIONS } from '../../../constants/payments';
import { ReminderRule } from '../../../types/payments';
import { parseEmailTemplate, renderPreview } from '../../../utils/helperFunctions';

const { useBreakpoint } = Grid;

export type { ReminderRule };

interface ReminderRuleCardProps {
    rule: ReminderRule;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUpdate: (id: string, patch: Partial<ReminderRule>) => void;
    onSave?: (id: string, channel: 'email' | 'whatsapp') => void | Promise<void>;
}

const ReminderRuleCard: React.FC<ReminderRuleCardProps> = ({
    rule,
    isExpanded,
    onToggleExpand,
    onUpdate,
    onSave,
}) => {
    const screens = useBreakpoint();
    const isMobile = !screens.lg;

    const { subject: initSubject, body: initBody } = parseEmailTemplate(rule.emailTemplate);
    const [localSubject, setLocalSubject] = useState(initSubject);
    const [localBody, setLocalBody] = useState(initBody);
    const [localWhatsapp, setLocalWhatsapp] = useState(rule.whatsappTemplate);
    const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');
    const timingOptions = TIMING_OPTIONS[rule.timing];

    const fullEmailTemplate = `Subject: ${localSubject}\n\n${localBody}`;

    const handleSave = () => {
        if (activeChannel === 'email') {
            onUpdate(rule.id, { emailTemplate: fullEmailTemplate });
        } else {
            onUpdate(rule.id, { whatsappTemplate: localWhatsapp });
        }
        onSave?.(rule.id, activeChannel);
    };

    return (
        <Flex
            vertical
            gap={16}
            className={`px-3 py-3 lg:px-5 lg:py-4 rounded-xl border border-[#E4E4E7] ${
                rule.isEnabled ? 'bg-white' : 'bg-[#F9FAFB]'
            }`}
        >
            {/* Header row */}
            <Flex
                vertical={isMobile}
                justify={isMobile ? undefined : 'space-between'}
                align={isMobile ? undefined : 'center'}
                gap={isMobile ? 8 : 0}
                className={rule.isEnabled ? '' : 'opacity-70'}
            >
                {/* Title row — on mobile also contains the chevron */}
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={12}>
                        <Switch
                            checked={rule.isEnabled}
                            onChange={checked => onUpdate(rule.id, { isEnabled: checked })}
                            className={rule.isEnabled ? 'bg-[#43B75D]' : 'bg-stone-300'}
                            size="small"
                        />
                        <Flex vertical gap={1}>
                            <Flex align="center" gap={6}>
                                <TypographyText className="text-sm font-medium">
                                    {rule.title}
                                </TypographyText>
                                <Tag
                                    className={`rounded-full text-xs font-normal border-0 px-2 py-0.5 ${
                                        rule.isEnabled
                                            ? 'bg-[#ECFDF5] text-[#43B75D]'
                                            : 'bg-[#F4F4F5] text-[#A1A1AA]'
                                    }`}
                                >
                                    {rule.isEnabled ? 'Active' : 'Disabled'}
                                </Tag>
                            </Flex>
                            <TypographyText className="text-[#6B7280] text-xs">
                                {rule.subtitle}
                            </TypographyText>
                        </Flex>
                    </Flex>
                    {isMobile && (
                        <Button
                            type="text"
                            size="small"
                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                            onClick={onToggleExpand}
                            className="text-[#A1A1AA] hover:text-[#475569]"
                        />
                    )}
                </Flex>

                {/* Controls row: timing select + channel badges + chevron (desktop only) */}
                <Flex
                    align="center"
                    gap={8}
                    justify={isMobile ? 'flex-start' : 'flex-end'}
                    className="flex-wrap"
                >
                    <Select
                        value={rule.days}
                        options={timingOptions}
                        onChange={val => onUpdate(rule.id, { days: val })}
                        popupMatchSelectWidth={false}
                    />

                    <Flex
                        align="center"
                        gap={3}
                        className={`px-2 py-0.5 rounded-full cursor-pointer border whitespace-nowrap flex-shrink-0 ${
                            rule.emailEnabled
                                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#EF4444]'
                                : 'border-[#E4E4E7] text-[#A1A1AA]'
                        }`}
                        onClick={() => onUpdate(rule.id, { emailEnabled: !rule.emailEnabled })}
                    >
                        <MailOutlined className="text-[10px]" />
                        <TypographyText className="text-xs !text-current">Email</TypographyText>
                    </Flex>

                    <Flex
                        align="center"
                        gap={3}
                        className={`px-2 py-0.5 rounded-full cursor-pointer border whitespace-nowrap flex-shrink-0 ${
                            rule.whatsappEnabled
                                ? 'bg-[#ECFDF5] border-[#BBF7D0] text-[#43B75D]'
                                : 'border-[#E4E4E7] text-[#A1A1AA]'
                        }`}
                        onClick={() =>
                            onUpdate(rule.id, { whatsappEnabled: !rule.whatsappEnabled })
                        }
                    >
                        <WhatsAppOutlined className="text-[10px]" />
                        <TypographyText className="text-xs !text-current">Whatsapp</TypographyText>
                    </Flex>

                    {!isMobile && (
                        <Button
                            type="text"
                            size="small"
                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                            onClick={onToggleExpand}
                            className="text-[#A1A1AA] hover:text-[#475569]"
                        />
                    )}
                </Flex>
            </Flex>

            {/* Expanded: template editor */}
            {isExpanded && (
                <>
                    <div className="border-t border-black/5" />

                    <Flex vertical gap={8}>
                        {/* Channel tab buttons */}
                        <Flex gap={8} justify="end" className="flex-col sm:flex-row">
                            <Button
                                type={activeChannel === 'email' ? 'primary' : 'default'}
                                icon={<MailOutlined />}
                                onClick={() => setActiveChannel('email')}
                                className={`py-4 rounded-lg text-xs ${isMobile ? 'flex-1' : ''} ${
                                    activeChannel === 'email'
                                        ? 'bg-[#FF4F4F] border-[#FF4F4F] hover:bg-[#e64444]'
                                        : 'border-[#CBD5E1] text-[#475569]'
                                }`}
                            >
                                Email template
                            </Button>
                            <Button
                                type={activeChannel === 'whatsapp' ? 'primary' : 'default'}
                                icon={<WhatsAppOutlined />}
                                onClick={() => setActiveChannel('whatsapp')}
                                className={`py-4 rounded-lg text-xs ${isMobile ? 'flex-1' : ''} ${
                                    activeChannel === 'whatsapp'
                                        ? 'bg-[#43B75D] border-[#43B75D] hover:bg-[#37a050]'
                                        : 'border-[#CBD5E1] text-[#475569]'
                                }`}
                            >
                                Whatsapp template
                            </Button>
                        </Flex>

                        <Flex gap={16} align="stretch" vertical={isMobile}>
                            {/* Left: template editor */}
                            <Flex vertical gap={8} className="flex-1">
                                <Flex
                                    vertical
                                    className="border border-[#E4E4E7] rounded-xl overflow-hidden"
                                >
                                    <Flex
                                        align="center"
                                        gap={6}
                                        className="px-4 py-3 bg-slate-50 border-b border-[#E4E4E7]"
                                    >
                                        {activeChannel === 'email' ? (
                                            <MailOutlined className="text-[#475569] text-xs" />
                                        ) : (
                                            <WhatsAppOutlined className="text-[#475569] text-xs" />
                                        )}
                                        <TypographyText className="text-xs font-medium text-[#334155]">
                                            Message template
                                        </TypographyText>
                                        <TypographyText className="text-xs text-[#6B7280]">
                                            — edit the content sent to your customer
                                        </TypographyText>
                                    </Flex>

                                    {/* Subject row — email only */}
                                    {activeChannel === 'email' && (
                                        <Flex
                                            align="center"
                                            gap={8}
                                            className="px-4 py-2 border-b border-[#E4E4E7]"
                                        >
                                            <TypographyText className="text-xs text-[#6B7280] whitespace-nowrap">
                                                Subject:
                                            </TypographyText>
                                            <Input
                                                value={localSubject}
                                                onChange={e => setLocalSubject(e.target.value)}
                                                className="border-0 text-xs p-0 flex-1"
                                                placeholder="Enter subject..."
                                                variant="borderless"
                                                style={{ boxShadow: 'none', outline: 'none' }}
                                            />
                                        </Flex>
                                    )}

                                    {/* Body */}
                                    {activeChannel === 'email' ? (
                                        <Input.TextArea
                                            value={localBody}
                                            onChange={e => setLocalBody(e.target.value)}
                                            autoSize={{ minRows: 7 }}
                                            className="border-0 bg-white text-xs leading-5 resize-none rounded-none shadow-none"
                                        />
                                    ) : (
                                        <Input.TextArea
                                            value={localWhatsapp}
                                            onChange={e => setLocalWhatsapp(e.target.value)}
                                            autoSize={{ minRows: 8 }}
                                            className="border-0 bg-white text-xs leading-5 resize-none rounded-none shadow-none"
                                        />
                                    )}
                                </Flex>
                                <Flex justify="space-between" align="center" gap={8}>
                                    <TypographyText className="text-xs text-[#6B7280] overflow-x-auto whitespace-nowrap block">
                                        Variables: {'{customer_name}'} {'{invoice_id}'} {'{amount}'}{' '}
                                        {'{due_date}'} {'{payment_link}'}
                                    </TypographyText>
                                    <Button
                                        icon={<SaveOutlined />}
                                        onClick={handleSave}
                                        className="rounded-lg text-xs border-[#FF4F4F] text-[#FF4F4F] flex-shrink-0"
                                    >
                                        Save
                                    </Button>
                                </Flex>
                            </Flex>

                            {/* Right: preview card */}
                            <Flex vertical className="flex-1">
                                <Flex
                                    vertical
                                    className="border border-[#E4E4E7] rounded-xl overflow-hidden flex-1"
                                >
                                    <Flex
                                        align="center"
                                        gap={6}
                                        className="px-4 py-3 bg-slate-50 border-b border-[#E4E4E7]"
                                    >
                                        {activeChannel === 'email' ? (
                                            <MailOutlined className="text-[#334155] text-xs" />
                                        ) : (
                                            <WhatsAppOutlined className="text-[#334155] text-xs" />
                                        )}
                                        <TypographyText className="text-xs text-[#334155]">
                                            {activeChannel === 'email'
                                                ? 'Email Preview'
                                                : 'WhatsApp Preview'}
                                        </TypographyText>
                                    </Flex>
                                    <Flex className="px-4 py-3 flex-1">
                                        <TypographyText className="text-xs leading-5 whitespace-pre-wrap text-gray-900">
                                            {activeChannel === 'email'
                                                ? renderPreview(fullEmailTemplate)
                                                : renderPreview(localWhatsapp)}
                                        </TypographyText>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default ReminderRuleCard;
