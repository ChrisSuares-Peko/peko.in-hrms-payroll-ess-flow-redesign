import { InfoCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

// Nudges the user to save on this long KYC step — progress is stored on the
// server only when they Save or click Next, so mid-form data would otherwise be
// lost on a reload / dropped connection / stepping back.
const SaveProgressNote = () => (
    <div className="bg-[#fffbeb] flex gap-2 items-start px-3 py-[10px] rounded-[8px] border border-[#fde68a]">
        <InfoCircleOutlined className="text-[#d97706] mt-[2px]" style={{ fontSize: 15 }} />
        <Text className="!text-[13px] !text-[#92400e] !leading-[20px]">
            This is a long form. Use <span className="font-medium">Save progress</span> after
            filling each person so your details aren&apos;t lost if you lose connection or leave
            the page — progress is otherwise stored only when you click Next.
        </Text>
    </div>
);

export default SaveProgressNote;
