import { ReactNode, useState } from 'react';

import { EyeOutlined, RedoOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Select, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { GovernmentServiceApplicationV2Item } from '../apis';
import useApplicationsListApi from '../hooks/useApplicationsListApi';
import { Service } from '../types';
import { isGstCancellationService } from '../utils/gstCancellationForm';
import { isGstRegistrationService } from '../utils/gstForm';


const { Text } = Typography;

// Service | Proposed name | Application ID | Created | Status | Action. Service/Proposed name are
// capped with minmax() instead of a bare fr unit — otherwise they keep soaking up every bit of
// leftover width on a wide screen, however short their actual text is. Capping them means the row
// simply stops growing past a sensible width, leaving plain space after Action instead of stretching.
const COLS =
    'grid grid-cols-[minmax(200px,340px)_minmax(160px,280px)_130px_160px_120px_180px] items-center gap-3';

const STATUS_FILTER_OPTIONS = [
    { value: 'incompleted', label: 'Incompleted' },
    { value: 'completed', label: 'Completed' },
];

const badgeFor = (row: GovernmentServiceApplicationV2Item) =>
    row.isFormSubmissionComplete
        ? { label: 'Completed', bg: '#ecfdf5', color: '#43b75d' }
        : { label: 'Incompleted', bg: '#fffbeb', color: '#f59e0b' };

const proposedName = (row: GovernmentServiceApplicationV2Item): string =>
    row.legalBusinessName || '—';

// Trademark Registration, Trademark Objection, Expedited Trademark, GST Registration, GST
// Cancellation and Import Export Code are separate forms sharing the same "Continue" button — pick
// the right one by service name/serviceId rather than assuming Registration. Expedited is its own
// catalog row (own vendorCatalogId), but that row's own serviceName column still holds the generic
// base string — "Expedited" lives in variantName instead, so it must be checked too or the row
// resolves to plain Registration.
const resolveFormSegment = (row: GovernmentServiceApplicationV2Item): string => {
    if (row.serviceName?.toLowerCase().includes('objection'))
        return paths.governmentServices.objection;
    if (
        row.serviceName?.toLowerCase().includes('expedited') ||
        row.variantName?.toLowerCase().includes('expedited')
    )
        return paths.governmentServices.expedited;
    if (row.serviceName?.toLowerCase().includes('import export code'))
        return paths.governmentServices.iec;
    if (isGstRegistrationService(row.serviceId)) return paths.governmentServices.gstRegister;
    if (isGstCancellationService(row.serviceId)) return paths.governmentServices.cancellation;
    return paths.governmentServices.register;
};

const fmtDate = (iso?: string): string =>
    iso
        ? new Date(iso).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

const fmtTime = (iso?: string): string =>
    iso
        ? new Date(iso).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
          })
        : '';

const MyApplications = () => {
    const navigate = useNavigate();
    const { applications, isLoading } = useApplicationsListApi();
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

    // Client-side filter — the full list is already fetched.
    const visibleRows = applications.filter(row => {
        if (!statusFilter) return true;
        return statusFilter === 'incompleted'
            ? !row.isFormSubmissionComplete
            : row.isFormSubmissionComplete;
    });

    const goToService = (row: GovernmentServiceApplicationV2Item) => {
        if (!row.vendorCatalogId) return;
        const serviceUrl = `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${Number(row.vendorCatalogId)}`;
        const formSegment = resolveFormSegment(row);
        // Objection's own hook (useObjectionApplicationData) doesn't read fallbackService — every
        // other form's hook does (see useServiceDetailData/useTrademarkApplicationData/
        // useIecApplicationData), so it's only skipped for Objection.
        const isObjection = formSegment === paths.governmentServices.objection;
        const fallbackService: Service | undefined = isObjection
            ? undefined
            : {
                  id: Number(row.vendorCatalogId),
                  serviceId: null,
                  name: row.serviceName ?? '',
                  slug: '',
                  accessKey: row.vendorCatalogId,
                  description: '',
                  category: row.variantName ?? '',
                  tab: 'Mandatory',
                  duration: '',
                  price: Number(row.amount) || 0,
                  govtFee: 'Free',
              };
        if (row.status === 'SUBMITTED') {
            navigate(`${serviceUrl}/${formSegment}`, {
                state: { applicationRowId: row.id, fallbackService },
            });
            return;
        }
        navigate(serviceUrl, {
            state: { resumeExisting: true, applicationRowId: row.id, fallbackService },
        });
    };

    const goToTracking = (row: GovernmentServiceApplicationV2Item) => {
        navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.tracking}`, {
            state: { application: row },
        });
    };

    let tableBody: ReactNode;
    if (isLoading) {
        tableBody = <Skeleton active paragraph={{ rows: 10 }} />;
    } else if (visibleRows.length === 0) {
        tableBody = (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                    applications.length === 0
                        ? 'No applications yet'
                        : 'No applications match this filter'
                }
                className="py-10"
            />
        );
    } else {
        tableBody = (
            <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                    <div
                        className={`${COLS} bg-[#fafafa] border-b border-[#eaecf0] px-[20px] h-[43px]`}
                    >
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">
                            Service
                        </Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">
                            Proposed name
                        </Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">
                            Application ID
                        </Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">
                            Created
                        </Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">
                            Status
                        </Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)] text-right">
                            Action
                        </Text>
                    </div>

                    {visibleRows.map(row => {
                        const badge = badgeFor(row);
                        return (
                            <div
                                key={row.id}
                                className={`${COLS} border-b border-[#eaecf0] px-[20px] h-[70px]`}
                            >
                                <Flex vertical className="min-w-0 pr-2">
                                    <Text
                                        className="!block !text-[16px] !text-black truncate"
                                        title={row.serviceName ?? undefined}
                                    >
                                        {row.serviceName ?? 'Government Service'}
                                    </Text>
                                    {row.variantName && (
                                        <Text className="!block !text-[12px] !text-[#94a3b8] truncate">
                                            {row.variantName}
                                        </Text>
                                    )}
                                </Flex>
                                <Text
                                    className="!text-[15px] !text-[#1e293b] truncate pr-2"
                                    title={proposedName(row)}
                                >
                                    {proposedName(row)}
                                </Text>
                                <Text
                                    className="!text-[15px] !text-[#1e293b] truncate pr-2"
                                    title={row.applicationId ?? undefined}
                                >
                                    {row.applicationId ?? '—'}
                                </Text>
                                <div className="min-w-0 pr-2">
                                    <Text className="!block !text-[15px] !text-[#1e293b] truncate">
                                        {fmtDate(row.createdOn)}
                                    </Text>
                                    <Text className="!block !text-[12px] !text-[#94a3b8] truncate">
                                        {fmtTime(row.createdOn)}
                                    </Text>
                                </div>
                                <div>
                                    <span
                                        className="inline-flex items-center justify-center rounded-[9px] w-[96px] py-[2px] text-[14px] font-medium"
                                        style={{ backgroundColor: badge.bg, color: badge.color }}
                                    >
                                        {badge.label}
                                    </span>
                                </div>
                                <div className="flex justify-end">
                                    {row.isFormSubmissionComplete ? (
                                        <Button
                                            icon={<EyeOutlined style={{ fontSize: 15 }} />}
                                            onClick={() => goToTracking(row)}
                                            className="!h-[35px] !w-[170px] !text-[11px] !rounded-[6px] !bg-white !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
                                        >
                                            View Details
                                        </Button>
                                    ) : (
                                        // vendorCatalogId is always present for a row we created, but
                                        // guarded defensively — goToService is a no-op without it anyway.
                                        row.vendorCatalogId && (
                                            <Button
                                                icon={<RedoOutlined style={{ fontSize: 15 }} />}
                                                onClick={() => goToService(row)}
                                                className="!h-[35px] !w-[170px] !text-[11px] !rounded-[6px] !bg-white !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
                                            >
                                                Continue application
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-[1500px] mx-auto">
                <div className="bg-white border border-[#dbdbdb] rounded-[30px] p-4 sm:p-8">
                    <div className="flex items-center justify-between gap-4 mb-[26px]">
                        <Text className="!text-[24px] !font-medium !text-[#171717] !leading-[1.12]">
                            My Applications
                        </Text>
                        <Select
                            allowClear
                            placeholder="Select Status"
                            options={STATUS_FILTER_OPTIONS}
                            onChange={value => setStatusFilter(value)}
                            className="w-[208px] [&_.ant-select-selector]:!rounded-[8px]"
                        />
                    </div>

                    {tableBody}
                </div>
            </div>
        </div>
    );
};

export default MyApplications;
