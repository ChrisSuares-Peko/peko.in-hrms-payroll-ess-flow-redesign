import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChallanStatusBadge from './ChallanStatusBadge';
import { Challan, isChallanPayable, isCourtMatter } from '../types/index';

const { Text, Title } = Typography;

interface Props {
    open: boolean;
    challan: Challan | null;
    onClose: () => void;
    onPay: (challan: Challan) => void;
}

// Droom returns empty strings rather than omitting fields (e.g. challan_place, rto), so treat
// blank text as missing and show a dash instead of an empty row.
const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
    const { sm } = useScreenSize();
    const isBlank =
        value === null || value === undefined || (typeof value === 'string' && !value.trim());

    return (
        <Flex
            vertical={!sm}
            justify="space-between"
            align="start"
            gap={sm ? 16 : 4}
            className="py-2.5"
        >
            <Text className="shrink-0 whitespace-nowrap text-[#486284]">{label}</Text>
            <Text className={`break-words font-medium text-[#1E293B] ${sm ? 'text-right' : ''}`}>
                {isBlank ? '—' : value}
            </Text>
        </Flex>
    );
};

const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.format('DD MMM YYYY') : value.split(' ')[0];
};

const ChallanDetailsDrawer = ({ open, challan, onClose, onPay }: Props) => {
    const courtMatter = challan ? isCourtMatter(challan) : false;
    const payable = challan ? isChallanPayable(challan) : false;

    return (
        <Drawer
            title={
                <Flex vertical>
                    <Title level={5} className="!mb-0">
                        Challan Details
                    </Title>
                    <Text className="text-sm font-normal text-[#486284]">
                        Review the details below
                    </Text>
                </Flex>
            }
            closeIcon={<ArrowLeftOutlined />}
            extra={challan ? <ChallanStatusBadge status={challan.challan_status} /> : null}
            open={open}
            onClose={onClose}
            width={460}
            footer={
                <Flex gap={12} justify="end">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type="primary"
                        disabled={!payable}
                        onClick={() => challan && onPay(challan)}
                    >
                        Pay
                    </Button>
                </Flex>
            }
        >
            {challan && (
                <Flex vertical gap={16}>
                    <Flex vertical gap={6}>
                        <Text className="text-xs text-[#868686]">Offense:</Text>
                        <Text className="text-base font-semibold text-[#1E293B]">
                            {challan.offense_details || '—'}
                        </Text>
                    </Flex>

                    <Flex
                        justify="space-between"
                        gap={16}
                        className="rounded-xl border border-[#EFF1F4] p-4"
                    >
                        <Flex vertical gap={4}>
                            <Text className="text-xs text-[#868686]">Amount due:</Text>
                            <Text className="text-base font-semibold text-[#1E293B]">
                                ₹ {formatNumberWithLocalString(challan.amount)}
                            </Text>
                        </Flex>
                        <Flex vertical gap={4} align="end">
                            <Text className="text-xs text-[#868686]">Challan Date:</Text>
                            <Text className="text-base font-semibold text-[#1E293B]">
                                {formatDate(challan.challan_date)}
                            </Text>
                        </Flex>
                    </Flex>

                    <Flex vertical className="rounded-xl border border-[#EFF1F4] px-4 py-1">
                        <DetailRow label="Challan Number" value={challan.challan_number} />
                        <DetailRow label="Vehicle" value={challan.registration_number} />
                        <DetailRow label="Accused Name" value={challan.accused_name} />
                        <DetailRow label="State" value={challan.state} />
                        <DetailRow label="Location" value={challan.challan_place} />
                        <DetailRow label="RTO" value={challan.rto || 'NA'} />
                    </Flex>

                    {courtMatter && (
                        <Flex vertical>
                            <Text className="mb-1 font-semibold text-[#B42318]">Court matter</Text>
                            <DetailRow label="Court Name" value={challan.court_name} />
                            {challan.court_address && (
                                <DetailRow label="Court Address" value={challan.court_address} />
                            )}
                            <Text className="mt-2 text-xs text-[#B42318]">
                                Court challan — may take longer to process
                            </Text>
                        </Flex>
                    )}
                </Flex>
            )}
        </Drawer>
    );
};

export default ChallanDetailsDrawer;
