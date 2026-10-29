import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Row, Button } from 'antd';

export const CloseBtn = ({
    isFlightDetailsVisible,
    setIsFlightDetailsVisible,
}: {
    isFlightDetailsVisible: boolean;
    setIsFlightDetailsVisible: (v: boolean) => void;
}) => (
    <Row justify="center" style={{ marginTop: '-10px' }}>
        <Button
            type="primary"
            shape="round"
            size="small"
            style={{
                backgroundColor: '#FFF1F0',
                color: '#FF4D4F',
                borderColor: 'transparent',
                fontWeight: 'bold',
                height: '18px',
                width: '129px',
                fontSize: '12px',
                paddingTop: '1px',
            }}
            onClick={() => setIsFlightDetailsVisible(!isFlightDetailsVisible)}
            className="inline-block"
        >
            {isFlightDetailsVisible ? (
                <>
                    <ArrowUpOutlined />
                    {` Close `}
                    <ArrowUpOutlined />
                </>
            ) : (
                <>
                    <ArrowDownOutlined />
                    {` Flight Details `}
                    <ArrowDownOutlined />
                </>
            )}
        </Button>
    </Row>
);
