import { useState } from 'react';

import { Flex, Grid, Switch, Typography } from 'antd';

import ReminderRuleCard from './ReminderRuleCard';
import ReminderRulesError from './ReminderRulesError';
import ReminderRulesSkeleton from './ReminderRulesSkeleton';
import useReminderRules from '../../../hooks/useReminderRules';

const { useBreakpoint } = Grid;

const ReminderRulesSection = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.lg;

    const { rules, automaticReminders, isLoading, isError, updateRule, saveTemplate, toggleAutomaticReminders } = useReminderRules();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleToggleExpand = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    return (
        <Flex vertical gap={16} className="p-4 lg:p-6 bg-stone-50 rounded-2xl border border-[#E4E4E7]">
            <Flex
                justify={isMobile ? 'flex-start' : 'space-between'}
                align={isMobile ? 'flex-start' : 'center'}
                vertical={isMobile}
                gap={isMobile ? 12 : 0}
            >
                <Flex vertical gap={2}>
                    <Typography.Text className="text-lg font-semibold">
                        Reminder Rules
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#6B7280]">
                        Configure automated reminders with custom message templates for Email and
                        WhatsApp
                    </Typography.Text>
                </Flex>
                <Flex align="center" gap={8}>
                    <Typography.Text className="text-sm text-[#6B7280]">
                        Automatic reminders
                    </Typography.Text>
                    <Switch
                        checked={automaticReminders}
                        onChange={toggleAutomaticReminders}
                        className={automaticReminders ? 'bg-[#43B75D]' : 'bg-stone-300'}
                    />
                </Flex>
            </Flex>

            {isLoading && <ReminderRulesSkeleton />}
            {!isLoading && isError && <ReminderRulesError />}
            {!isLoading && !isError && (
                <Flex
                    vertical
                    gap={8}
                    className={!automaticReminders ? 'pointer-events-none opacity-40' : ''}
                >
                    {rules.map(rule => (
                        <ReminderRuleCard
                            key={rule.id}
                            rule={rule}
                            isExpanded={expandedId === rule.id}
                            onToggleExpand={() => handleToggleExpand(rule.id)}
                            onUpdate={updateRule}
                            onSave={saveTemplate}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    );
};

export default ReminderRulesSection;
