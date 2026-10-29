import { Button, Flex, Typography } from 'antd';
import { FiPhone } from 'react-icons/fi';

import iconPenaltyAlert from '../../assets/icons/icon-penalty-alert.svg';
import iconPendingAlert from '../../assets/icons/icon-pending-alert.svg';

const { Text } = Typography;

export default function RecentUpdates() {
  return (
    <div className="bg-[#f9f9f9] rounded-[24px] px-4 sm:px-7 pt-6 sm:pt-8 pb-6 sm:pb-8 h-full w-full">
      <Flex vertical gap={24} className="sm:gap-8">
        <Text className="text-[16px] sm:text-[20px] font-semibold leading-[28px] text-black block">Recent Updates</Text>
        <Flex vertical gap={16}>

          {/* Penalty Alert */}
          <div className="bg-[#fef2f2] border-[1.336px] border-[#ffeaea] rounded-[22px] p-4 sm:p-6 flex flex-col gap-4">
            <Flex align="center" gap={12}>
              <img src={iconPenaltyAlert} alt="" className="size-6 shrink-0" />
              <Text className="text-[15px] sm:text-[18px] font-semibold leading-[26px] text-black">Penalty Exposure Alert</Text>
            </Flex>
            <Flex vertical gap={12}>
              <Text className="text-[13px] sm:text-[16px] font-normal leading-[22px] sm:leading-[24px] text-black block">
                You have pending compliances that may result in penalties if not completed on time.
              </Text>
              <div className="border-t border-[#ffd5d5]" />
              <Flex justify="space-between" align="center" gap={8}>
                <Text className="text-[13px] sm:text-[16px] font-normal leading-[24px] text-[#ff4f4f]">Total Potential Penalty</Text>
                <Text className="text-[13px] sm:text-[16px] font-semibold leading-[24px] text-[#ff4f4f] shrink-0">₹14,08,405</Text>
              </Flex>
            </Flex>
          </div>

          {/* Pending Compliance Actions */}
          <div className="bg-[#fffdf3] border-[1.336px] border-[#fff1b7] rounded-[22px] p-4 sm:p-6 flex flex-col gap-4">
            <Flex align="center" gap={12}>
              <img src={iconPendingAlert} alt="" className="size-6 shrink-0" />
              <Text className="text-[15px] sm:text-[18px] font-semibold leading-[26px] text-black">Pending Compliance Actions</Text>
            </Flex>
            <Flex vertical gap={16} className="sm:gap-6">
              <Text className="text-[13px] sm:text-[16px] font-normal leading-[22px] sm:leading-[24px] text-[#1e293b] block">
                Your compliance score indicates pending actions. Get expert help to stay on track.
              </Text>
              <a
                href="tel:02248930373"
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-[0.5px] border-[#ff4f4f] rounded-[12px] px-3 py-3 no-underline w-full"
              >
                <Flex align="center" gap={8}>
                  <div className="bg-[#f7f3dd] rounded-full p-2 flex items-center justify-center shrink-0">
                    <FiPhone className="text-[#ff4f4f] size-5 sm:size-6" />
                  </div>
                  <Flex vertical gap={6}>
                    <Text className="text-[13px] sm:text-[16px] font-normal leading-[16px] text-[#1e293b]">
                      Talk to compliance expert ?
                    </Text>
                    <Text className="text-[13px] sm:text-[16px] font-medium leading-[16px] text-[#1e293b]">
                      022 489 30373
                    </Text>
                  </Flex>
                </Flex>
                <Button
                  icon={<FiPhone className="size-3" />}
                  className="flex items-center justify-center border-[#ff4f4f] text-[#ff4f4f] text-[11px] sm:text-xs font-medium rounded-[7px] px-2 sm:px-3 h-7 sm:h-auto sm:py-1.5 w-full sm:w-auto shrink-0"
                  style={{ borderWidth: '0.943px' }}
                >
                  Call Now
                </Button>
              </a>
            </Flex>
          </div>

        </Flex>
      </Flex>
    </div>
  );
}
