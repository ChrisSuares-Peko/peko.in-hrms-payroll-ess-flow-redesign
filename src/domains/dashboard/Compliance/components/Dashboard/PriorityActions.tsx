import { Flex, Skeleton, Typography } from 'antd';
import { FiCalendar, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import iconInfoCircle from '../../assets/icons/icon-info-circle.svg';
import { useCompliancePriorityActions } from '../../hooks/useCompliancePriorityActions';

const { Text } = Typography;

type Actions = ReturnType<typeof useCompliancePriorityActions>['actions'];

function ActionsList({ actions }: { actions: Actions }) {
  if (actions.length === 0) {
    return <Text className="text-[14px] text-[#6a7282] py-4 text-center block">No pending actions</Text>;
  }
  return (
    <>
      {actions.map((action) => (
        <div
          key={action.id}
          className="rounded-[24px] px-5 py-4 flex items-center justify-between bg-white"
          style={{ border: '0.5px solid #eaeaea' }}
        >
          <Flex align="center" gap={16} className="min-w-0">
            <div className="bg-[#fffbeb] border border-[#fff3de] rounded-[12px] size-[54px] flex items-center justify-center shrink-0">
              <img src={iconInfoCircle} alt="" className="size-6 object-contain" />
            </div>
            <Flex vertical gap={8} className="min-w-0">
              <Text className="text-[14px] sm:text-[18px] font-semibold leading-[22px] sm:leading-[26px] text-[#2f2b2a] block truncate">{action.title}</Text>
              <Text className="text-[14px] font-normal leading-[22px] text-black block">{action.complianceType}</Text>
              <Flex align="center" gap={4}>
                <FiCalendar className="size-4 text-[#838383] shrink-0" />
                <Text className="text-[12px] font-normal leading-[18px] text-[#838383]">Due: {action.due}</Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex align="center" gap={6} className="shrink-0 ml-3">
            {action.isHighPriority && (
              <span className="bg-[#fef2f2] border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-[12px] font-normal leading-[18px] px-3 py-1.5 rounded-[100px] shrink-0 hidden sm:inline">
                High Priority
              </span>
            )}
            <span className="bg-[#fffbeb] border border-[rgba(245,158,11,0.2)] text-[#f59e0b] text-[14px] font-normal leading-[22px] px-3 py-1.5 rounded-[80px] whitespace-nowrap hidden sm:inline">
              {action.daysLeft}
            </span>
            <FiChevronRight className="size-5 text-gray-400" />
          </Flex>
        </div>
      ))}
    </>
  );
}

export default function PriorityActions() {
  const navigate = useNavigate();
  const { actions, isLoading } = useCompliancePriorityActions();

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_13px_0_rgba(0,0,0,0.06)]">
      <Flex justify="space-between" align="center" className="pb-3 -mx-5 px-5" style={{ borderBottom: '1px solid #eaeaea' }}>
        <Text className="text-[16px] sm:text-[20px] font-semibold leading-[28px] text-black">Priority Actions</Text>
        <Text
          className="text-[14px] sm:text-[20px] font-normal leading-[32px] text-black cursor-pointer hover:text-[#3d61ff]"
          onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.myCompliances}`)}
        >
          View all
        </Text>
      </Flex>
      <Flex vertical gap={12} className="mt-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[24px] px-5 py-4" style={{ border: '0.5px solid #eaeaea' }}>
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </div>
          ))
        ) : (
          <ActionsList actions={actions} />
        )}
      </Flex>
    </div>
  );
}
