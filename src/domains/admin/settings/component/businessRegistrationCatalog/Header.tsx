import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';

type Props = {
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchText: string;
    onSync: () => void;
    isSyncing: boolean;
};

const CatalogHeader = ({ searchText, handleSearch, onSync, isSyncing }: Props) => (
    <Row gutter={[20, 20]} justify="space-between">
        <Col className="flex w-full sm:w-fit gap-3">
            <Button
                type="primary"
                className="w-full sm:w-fit"
                danger
                icon={<ReloadOutlined />}
                loading={isSyncing}
                onClick={onSync}
            >
                Sync from vendor
            </Button>
        </Col>
        <Col xs={24} sm={12} md={8}>
            <Input
                value={searchText}
                placeholder="Search service"
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                maxLength={100}
            />
        </Col>
    </Row>
);

export default CatalogHeader;
