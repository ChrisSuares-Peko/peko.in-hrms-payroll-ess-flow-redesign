import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const { Title, Text } = Typography;

export default function DashboardHeader() {
  const navigate = useNavigate();

  return (
    <Flex align="flex-start" justify="space-between" gap={12} wrap="wrap">
      <Flex vertical gap={6}>
        <Title level={2} className="!text-[20px] sm:!text-[28px] !font-semibold !leading-[38px] !text-[#101828] !mb-0 !mt-0">
          Compliance Dashboard
        </Title>
        <Text className="text-[14px] sm:text-[20px] font-normal leading-[24px] sm:leading-[32px] text-[#6a7282]">
          Welcome back! Here&apos;s an overview of your compliance status.
        </Text>
      </Flex>
      <Button
        className="!border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff2f2] shrink-0"
        onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.myCompliances}`)}
      >
        My application
      </Button>
    </Flex>
  );
}
