import { Button, Flex, Skeleton, Typography } from 'antd';
import { FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import HealthScoreIcon from '../../assets/icons/HealthScoreIcon';

const { Text } = Typography;

interface HealthScoreCardProps {
  score: number | null;
  isLoading?: boolean;
}

export default function HealthScoreCard({ score, isLoading }: HealthScoreCardProps) {
  const navigate = useNavigate();

  return (
    <Flex vertical gap={24} className="bg-[#f8faff] border-[0.5px] border-[#bbceff] rounded-[32px] px-5 py-5 lg:px-[35px] lg:py-[25px]">
      <Text className="text-base font-semibold leading-normal text-[#3d61ff]">
        Compliance Health Score
      </Text>
      <Flex align="start" justify="space-between" wrap="wrap" gap={12}>
        <Flex align="center" gap={16}>
          <Flex className="size-14 lg:size-[87px] shrink-0">
            <HealthScoreIcon score={score ?? 0} />
          </Flex>
          <Flex vertical gap={12} align="start">
            <Flex vertical align="start">
              <p className="text-[0px] leading-[0] font-semibold text-black">
                {isLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 80 }} />
                ) : (
                  <span className="text-[36px] font-semibold leading-none">{score ?? 0}</span>
                )}
                <span className="text-[16px] font-medium text-gray-500 leading-none">/100</span>
              </p>
            </Flex>
            {score === 100 ? (
              <p className="text-[13px] sm:text-[20px] font-normal leading-[20px] sm:leading-[28px] text-[#242424]">
                All pending tasks completed successfully. Your compliance score has improved and your business stays{' '}
                <span className="text-[#ff4f4f]">100% safe and secure.</span>
              </p>
            ) : (
              <Flex gap={4} align="baseline" wrap="wrap">
                <Text className="text-[13px] sm:text-[20px] font-normal leading-[20px] sm:leading-[32px] text-[#6a7282] whitespace-nowrap">Action required :</Text>
                <Text className="text-[13px] sm:text-[20px] font-semibold leading-[20px] sm:leading-[28px] text-[#242424]">
                  Complete pending tasks to improve score
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Button
          className="!h-12 !rounded-lg !text-base !font-medium !bg-white !border-[#afc6ff] !text-[#3d61ff]"
          icon={<FiArrowRight />}
          iconPosition="end"
          onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.health}`)}
        >
          View all
        </Button>
      </Flex>
    </Flex>
  );
}
