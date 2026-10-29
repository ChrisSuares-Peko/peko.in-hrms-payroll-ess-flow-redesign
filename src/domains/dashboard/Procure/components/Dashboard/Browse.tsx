import React from 'react';

import { Card, Col, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { browseItems } from '../../utils/data';

const { Text } = Typography;

const Browse: React.FC = () => {
  const navigate = useNavigate();
  const go = (sub: string) => navigate(sub);

  return (
    <div>
      <Typography.Text className='text-base font-roboto font-semibold'>Browse</Typography.Text>

      <Row gutter={[16, 16]}>
        {browseItems.map((item) => (
          <Col xs={12} sm={8} md={4} key={item.label}>
            <Card
              hoverable
             
              
              onClick={() => go(item.path)}
              className="!rounded-2xl bg-white hover:shadow-md transition-all text-center cursor-pointer !border-0 !shadow-none"
              styles={{ body: { padding: '12px 0px' } }}
            >
              <div className="mb-2 flex items-center justify-center rounded-3xl bg-[#f9f6f5] min-w-[5.6rem] h-24 p-3">
                <img src={item.icon} alt={item.label} className="w-12 h-12 object-contain" />
              </div>

              <Text className="text-center text-sm text-[#171717] max-w-[5rem] leading-snug">
                {item.label}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Browse;