import { Badge, Flex, Typography, Avatar, Tag, Row, Col } from 'antd';

import { getInitials } from '../../utils/employeeDetails/data';

interface LeaveSummaryHeaderProps {
  profileImage?: string | null;
  fullName?: string;
  designation?: string;
}

const LeaveSummaryHeader: React.FC<LeaveSummaryHeaderProps> = ({ profileImage, fullName, designation }:LeaveSummaryHeaderProps) => 
    (
  <Row gutter={[20, 20]}>
    <Col>
      <Avatar size={64} src={profileImage} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>
        {profileImage ? null : getInitials(fullName || '')}
      </Avatar>
    </Col>
    <Col>
      <Flex vertical justify="center">
        <Typography.Text className="text-xl font-semibold text-gray-800">
          {fullName}
        </Typography.Text>
        <Flex align="center" gap={10}>
          <Typography.Text className="text-sm text-gray-600">
            {designation}
          </Typography.Text>
        </Flex>
      </Flex>
    </Col>
    <Col>
      <Flex>
        <Tag
          color="#E4FFE8"
          style={{
            color: '#72DAA7',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Badge color="#72DAA7" />
          Active
        </Tag>
      </Flex>
    </Col>
  </Row>
);

export default LeaveSummaryHeader;
