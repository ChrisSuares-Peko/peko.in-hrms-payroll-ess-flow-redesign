import { InfoCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import { STATEMENT_COPY } from '../../../utils/statementData';

const { Text } = Typography;

/** Info banner explaining that internal wallet/card transfers are excluded from the statement. */
const StatementNote = () => (
    <div className="flex items-start gap-2 rounded-xl border border-borderCard bg-bgLightGray p-4">
        <InfoCircleOutlined className="mt-0.5 shrink-0 text-textGreyLight" />
        <Text className="text-xs text-textBody sm:text-sm">{STATEMENT_COPY.note}</Text>
    </div>
);

export default StatementNote;
