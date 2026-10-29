import { ExportOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

interface Props {
    from?: string;
    to?: string;
    fyStart?: number;
    isExporting?: boolean;
    onFromChange?: (v: string | undefined) => void;
    onToChange?: (v: string | undefined) => void;
    onExport?: () => void;
}

const LedgerFilters = ({
    from,
    to,
    fyStart,
    isExporting,
    onFromChange,
    onToChange,
    onExport,
}: Props) => {
    const fyMin = fyStart ? dayjs(`${fyStart}-04-01`) : undefined;
    const fyMax = fyStart ? dayjs(`${fyStart + 1}-03-31`) : undefined;
    const defaultPicker = from ? dayjs(from, 'DD/MM/YYYY') : fyMin;
    return (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <Flex vertical gap={4}>
                    <Typography.Text className="text-xs font-medium" style={{ color: '#64748b' }}>
                        From
                    </Typography.Text>
                    <DatePicker
                        value={from ? dayjs(from, 'DD/MM/YYYY') : undefined}
                        defaultPickerValue={defaultPicker}
                        placeholder="Select Date"
                        format="DD/MM/YYYY"
                        className="w-full sm:w-[150px]"
                        allowClear={false}
                        inputReadOnly
                        minDate={fyMin}
                        maxDate={fyMax}
                        getPopupContainer={() => document.body}
                        onChange={(_: Dayjs | null, ds: string | string[]) => {
                            const val = typeof ds === 'string' ? ds : ds[0];
                            onFromChange?.(val || undefined);
                            if (!val) onToChange?.(undefined);
                        }}
                    />
                </Flex>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-xs font-medium" style={{ color: '#64748b' }}>
                        To
                    </Typography.Text>
                    <DatePicker
                        value={to ? dayjs(to, 'DD/MM/YYYY') : undefined}
                        defaultPickerValue={to ? dayjs(to, 'DD/MM/YYYY') : fyMin}
                        placeholder="Select Date"
                        format="DD/MM/YYYY"
                        className="w-full sm:w-[150px]"
                        allowClear={false}
                        inputReadOnly
                        minDate={fyMin}
                        maxDate={fyMax}
                        getPopupContainer={() => document.body}
                        onChange={(_: Dayjs | null, ds: string | string[]) => {
                            const val = typeof ds === 'string' ? ds : ds[0];
                            onToChange?.(val || undefined);
                            if (!val) onFromChange?.(undefined);
                        }}
                    />
                </Flex>
            </div>
            <Button
                icon={<ExportOutlined />}
                loading={isExporting}
                className="w-full sm:w-auto"
                style={{ borderColor: '#ff4f4f', color: '#ff4f4f', height: 36 }}
                onClick={onExport}
            >
                Export CSV
            </Button>
        </div>
    );
};

export default LedgerFilters;
