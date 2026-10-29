import React from 'react';

import { DatePicker, InputNumber, Radio, Select, Typography } from 'antd';
import dayjs from 'dayjs';

import { RecurrenceRule } from '../../types/recurring';

type Props = {
    value: RecurrenceRule;
    onChange: (v: RecurrenceRule) => void;
    minDate?: string;
};

const FrequencyPicker: React.FC<Props> = ({ value, onChange, minDate }) => {
    const update = (patch: Partial<RecurrenceRule>) => onChange({ ...value, ...patch });

    return (
        <div className="space-y-5">
            <div>
                <Typography.Text className="text-sm text-gray-900 font-medium block mb-2">
                    Frequency
                </Typography.Text>
                <div className="flex gap-2">
                    <Select
                        value={value.interval}
                        onChange={v => update({ interval: v })}
                        className="w-28"
                        options={Array.from({ length: 12 }, (_, i) => ({
                            label: `Every ${i + 1}`,
                            value: i + 1,
                        }))}
                    />
                    <Select
                        value={value.frequency}
                        onChange={f => update({ frequency: f })}
                        className="flex-1"
                        options={[
                            { label: 'Day(s)', value: 'DAILY' },
                            { label: 'Week(s)', value: 'WEEKLY' },
                            { label: 'Month(s)', value: 'MONTHLY' },
                            { label: 'Quarter(s)', value: 'QUARTERLY' },
                            { label: 'Year(s)', value: 'YEARLY' },
                        ]}
                    />
                </div>
            </div>

            <div>
                <Typography.Text className="text-sm text-gray-900 font-medium block mb-2">
                    Start date
                </Typography.Text>
                <DatePicker
                    className="w-full"
                    value={value.startDate ? dayjs(value.startDate) : null}
                    disabledDate={minDate ? d => d.isBefore(dayjs(minDate), 'day') : undefined}
                    onChange={d =>
                        update({
                            startDate: d?.format('YYYY-MM-DD') ?? dayjs().format('YYYY-MM-DD'),
                        })
                    }
                />
            </div>

            <div>
                <Typography.Text className="text-sm text-gray-900 font-medium block mb-2">
                    End condition
                </Typography.Text>
                <Radio.Group
                    value={value.endCondition.type}
                    onChange={e => {
                        const t = e.target.value;
                        if (t === 'NEVER') update({ endCondition: { type: 'NEVER' } });
                        if (t === 'AFTER') update({ endCondition: { type: 'AFTER', count: 12 } });
                        if (t === 'ON')
                            update({
                                endCondition: {
                                    type: 'ON',
                                    date: dayjs().add(1, 'year').format('YYYY-MM-DD'),
                                },
                            });
                    }}
                    className="!flex !flex-col gap-2"
                >
                    <Radio value="NEVER">Runs forever</Radio>
                    <Radio value="AFTER">
                        <span className="flex items-center gap-2">
                            Ends after
                            <InputNumber
                                min={1}
                                max={999}
                                disabled={value.endCondition.type !== 'AFTER'}
                                value={
                                    value.endCondition.type === 'AFTER'
                                        ? value.endCondition.count
                                        : 12
                                }
                                onChange={v =>
                                    update({
                                        endCondition: {
                                            type: 'AFTER',
                                            count: Number(v) || 1,
                                        },
                                    })
                                }
                                className="!w-20"
                            />
                            runs
                        </span>
                    </Radio>
                    <Radio value="ON">
                        <span className="flex items-center gap-2">
                            Ends on
                            <DatePicker
                                disabled={value.endCondition.type !== 'ON'}
                                value={
                                    value.endCondition.type === 'ON'
                                        ? dayjs(value.endCondition.date)
                                        : null
                                }
                                onChange={d =>
                                    update({
                                        endCondition: {
                                            type: 'ON',
                                            date:
                                                d?.format('YYYY-MM-DD') ??
                                                dayjs().add(1, 'year').format('YYYY-MM-DD'),
                                        },
                                    })
                                }
                            />
                        </span>
                    </Radio>
                </Radio.Group>
            </div>
        </div>
    );
};

export default FrequencyPicker;
