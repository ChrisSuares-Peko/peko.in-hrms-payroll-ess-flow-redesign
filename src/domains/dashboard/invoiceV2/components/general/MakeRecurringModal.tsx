import React from 'react';

import { Input, Modal, Select, Spin, Switch, Typography } from 'antd';
import dayjs from 'dayjs';

import FrequencyPicker from './FrequencyPicker';
import { useMakeRecurring } from '../../hooks/recurring/useMakeRecurring';
import { InvoiceRow } from '../../types/invoice';
import { RecurringScheduleApiData } from '../../types/recurring';

type Props = {
    open: boolean;
    onClose: () => void;
    sourceInvoice?: InvoiceRow | null;
    onCreated?: (schedule: RecurringScheduleApiData) => void;
};

const MakeRecurringModal: React.FC<Props> = ({ open, onClose, sourceInvoice, onCreated }) => {
    const {
        invoiceOptions,
        isFetchingInvoices,
        activeInvoice,
        name,
        setName,
        rule,
        setRule,
        autoSend,
        setAutoSend,
        isSaving,
        nextRuns,
        selectValue,
        handleSave,
        handleSelectInvoice,
    } = useMakeRecurring({ open, sourceInvoice, onClose, onCreated });

    return (
        <Modal
            open={open}
            onCancel={onClose}
            onOk={handleSave}
            okText="Create schedule"
            confirmLoading={isSaving}
            okButtonProps={{ danger: true, disabled: !activeInvoice }}
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>Make invoice recurring</span>}
            width={640}
            centered
            styles={{ content: { borderRadius: 18 } }}
        >
            <div className="space-y-5 mt-3">
                <Field
                    label="Source invoice"
                    hint="Items, customer, and totals are cloned from this invoice on every run."
                >
                    <Select
                        showSearch
                        disabled={!!sourceInvoice}
                        className="w-full"
                        placeholder={isFetchingInvoices ? 'Loading invoices…' : 'Pick an invoice'}
                        value={selectValue}
                        onChange={handleSelectInvoice}
                        notFoundContent={
                            isFetchingInvoices ? <Spin size="small" /> : 'No invoices found'
                        }
                        options={
                            sourceInvoice
                                ? [
                                      {
                                          label: `${sourceInvoice.prefix ?? ''}${sourceInvoice.invoiceNumber} — ${sourceInvoice.name ?? '—'}`,
                                          value: String(sourceInvoice.id),
                                      },
                                  ]
                                : invoiceOptions.map(i => ({
                                      label: `${i.prefix ?? ''}${i.invoiceNumber} — ${i.name ?? '—'}`,
                                      value: String(i.id),
                                  }))
                        }
                        filterOption={(input, opt) =>
                            (opt?.label as string).toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Field>

                {activeInvoice && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">
                                    Each run will bill
                                </p>
                                <p className="text-xs text-gray-500">{activeInvoice.name ?? '—'}</p>
                            </div>
                            <p className="text-base font-bold text-gray-900">
                                ₹{' '}
                                {parseFloat(activeInvoice.totalAmount || '0').toLocaleString(
                                    'en-IN',
                                    { minimumFractionDigits: 2 }
                                )}
                            </p>
                        </div>
                    </div>
                )}

                <Field label="Schedule name">
                    <Input
                        placeholder="e.g. Monthly retainer — Acme Co."
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <FrequencyPicker
                        value={rule}
                        onChange={setRule}
                        minDate={
                            activeInvoice?.createdAt
                                ? dayjs(activeInvoice.createdAt).format('YYYY-MM-DD')
                                : undefined
                        }
                    />
                    <div>
                        <Typography.Text className="text-sm text-gray-900 font-medium block mb-2">
                            Next 4 runs
                        </Typography.Text>
                        <div className="space-y-1.5">
                            {nextRuns.map((d, i) => (
                                <div
                                    key={d}
                                    className="flex items-center justify-between text-sm bg-[#F8FAFC] px-3 py-2 rounded border border-gray-100"
                                >
                                    <span className="text-gray-600">Run {i + 1}</span>
                                    <span className="font-medium text-gray-900">
                                        {dayjs(d).format('ddd, DD MMM YYYY')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Field label="Auto-send on each run">
                    <div className="bg-[#F8FAFC] rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                        <span className="text-sm">Send immediately when generated</span>
                        <span className="[&_.ant-switch-checked]:!bg-[#FF4F4F] [&_.ant-switch-checked:hover]:!bg-[#FF4F4F]">
                            <Switch checked={autoSend} onChange={setAutoSend} />
                        </span>
                    </div>
                </Field>
            </div>
        </Modal>
    );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
    label,
    hint,
    children,
}) => (
    <div>
        <div className="text-sm text-gray-900 font-medium">{label}</div>
        {children}
        {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
);

export default MakeRecurringModal;
