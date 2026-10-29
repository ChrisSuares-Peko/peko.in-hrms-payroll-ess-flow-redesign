import { Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import iconArrowRight from '../../assets/icons/icon-arrow-right.svg';
import { quickAccess } from '../../utils/data';

const { Text } = Typography;

export default function QuickAccess() {
  const navigate = useNavigate();

  return (
    <Flex vertical gap={16}>
      <Text className="text-[18px] sm:text-[24px] font-semibold leading-[32px] text-black">Quick Access</Text>
      <Row gutter={[16, 12]}>
        {quickAccess.map((item) => (
          <Col xs={24} sm={8} key={item.label} style={{ display: 'flex' }}>
            <Flex
              align="center"
              justify="space-between"
              onClick={() => navigate(item.path)}
              className={`w-full cursor-pointer bg-white rounded-[24px] py-6 px-6 transition-shadow hover:shadow-md drop-shadow-[0px_2px_6.5px_rgba(0,0,0,0.06)] ${
                item.highlight ? 'border border-[#ff4f4f]' : 'border-[0.5px] border-[#eaeaea]'
              }`}
            >
              <Flex vertical align="flex-start" justify="center" gap={6}>
                <Flex align="center" justify="center" className="bg-[#fff2f2] rounded-[8px] size-[40px] shrink-0">
                  <img src={item.icon!} alt="" style={{ width: item.iconSize, height: item.iconSize }} className="object-contain" />
                </Flex>
                <Text className="!text-[#2C2C2C] !text-sm !font-medium !leading-[1.94]">{item.label}</Text>
              </Flex>
              <img src={iconArrowRight} alt="" className="size-6 shrink-0 ml-2" />
            </Flex>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
