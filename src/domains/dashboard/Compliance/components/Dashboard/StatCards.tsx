import { Col, Image, Row, Skeleton, Typography } from 'antd';

import iconCompleted from '../../assets/icons/icon-completed.svg';
import iconDueSoon from '../../assets/icons/icon-due-soon.svg';
import iconOverdue from '../../assets/icons/icon-overdue.svg';
import iconUpcoming from '../../assets/icons/icon-upcoming.svg';
import { ComplianceDashboardSummary } from '../../types';

const { Text } = Typography;

interface StatCardsProps {
  summary: ComplianceDashboardSummary | null;
  isLoading?: boolean;
}

export default function StatCards({ summary, isLoading }: StatCardsProps) {
  const stats = [
    { label: 'Completed', value: summary?.approved ?? 0, bgClass: 'bg-[#faede8]', icon: iconCompleted },
    { label: 'Due Soon',  value: summary?.dueSoon  ?? 0, bgClass: 'bg-[#f2e9f2]', icon: iconDueSoon  },
    { label: 'Overdue',   value: summary?.overdue  ?? 0, bgClass: 'bg-[#e5ecff]', icon: iconOverdue  },
    { label: 'Upcoming',  value: summary?.upcoming ?? 0, bgClass: 'bg-[#e1f3ea]', icon: iconUpcoming  },
  ];

  return (
    <Row gutter={[20, 16]}>
      {stats.map((stat) => (
        <Col xs={12} sm={12} md={6} key={stat.label}>
          <div className={`${stat.bgClass} rounded-[22px] px-2 py-2 lg:px-[35px] lg:py-[25px] h-[151px] flex flex-col justify-center gap-2`}>
            <div className="bg-white rounded-full w-[39px] h-[39px] flex items-center justify-center shrink-0">
              <Image src={stat.icon} alt="" width={22} height={22} preview={false} />
            </div>
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="w-[60px]">
                  <Skeleton.Input active size="small" block />
                </div>
              ) : (
                <Text className="text-[21px] font-semibold leading-none text-black block">{stat.value}</Text>
              )}
              <Text className="text-sm font-normal text-black block">{stat.label}</Text>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}
