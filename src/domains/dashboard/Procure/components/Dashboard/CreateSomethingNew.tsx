import React from 'react';

import { Grid, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import newPurchaseOrder from '../../assets/icons/newPurchaseOrder.svg';
import newPurchaseReq from '../../assets/icons/newPurchaseReq.svg';
import newRFQIcon from '../../assets/icons/newRFQIcon.svg';
import newVendorIcon from '../../assets/icons/newVendorIcon.svg';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const CreateSomethingNew: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const go = (sub: string) => navigate(`${paths.dashboard.procure}/${sub}`);

  const items = [
    { label: 'New Purchase Request', path: `${paths.procure.purchaseRequests.index}/${paths.procure.purchaseRequests.create}`, icon: newPurchaseReq },
    { label: 'New RFQ', path: `${paths.procure.rfq.index}/${paths.procure.rfq.create}`, icon: newRFQIcon },
    { label: 'New Purchase Order', path: `${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.create}`, icon: newPurchaseOrder },
    { label: 'Add Vendor', path: `${paths.procure.vendor.index}/${paths.procure.vendor.create}`, icon: newVendorIcon },
  ];

  // grid cols: 1 on xs, 2 on sm/md, 4 on lg+
  let gridCols = 1;
  if (screens.lg) gridCols = 4;
  else if (screens.sm) gridCols = 2;

  return (
    <Space direction="vertical" className="!w-full" size={8}>
      <Title level={5} className="!mb-0">
        Create something new
      </Title>

      <div
        className="rounded-[22px] p-2 sm:p-3 gap-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          background: 'rgba(255,255,255,0.78)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0px 1.2px 12.4px 0px rgba(0,0,0,0.06)',
        }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => go(item.path)}
            className="rounded-[16px] border border-[#ff4d4f] bg-white flex items-center justify-start px-3 gap-2 sm:gap-3 w-full cursor-pointer hover:bg-[#fff8f8] transition-colors"
            style={{ minHeight: 52, paddingTop: 10, paddingBottom: 10 }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fff8f8] flex items-center justify-center flex-shrink-0">
              <img src={item.icon} alt={item.label} className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <Text className="!text-[#0a0a0a] !text-xs sm:!text-sm font-medium text-left leading-tight break-words min-w-0">
              {item.label}
            </Text>
          </button>
        ))}
      </div>
    </Space>
  );
};

export default CreateSomethingNew;
