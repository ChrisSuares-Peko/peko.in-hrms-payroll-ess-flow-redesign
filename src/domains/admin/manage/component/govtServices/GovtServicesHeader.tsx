import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';

import { RolePermissionAccessData } from '../../types/govtServicesTypes';

type Props = {
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchText: string;
    onSync: () => void;
    isSyncing: boolean;
    accessPermission: RolePermissionAccessData | undefined;
};

const GovtServicesHeader = ({ searchText, handleSearch, onSync, isSyncing, accessPermission }: Props) => (
    <Row gutter={[20, 20]} justify="space-between" className="mt-4">
        <Col className="flex w-full sm:w-fit gap-3">
            {accessPermission?.write && (
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
            )}
        </Col>
        <Col xs={24} sm={12} md={8}>
            <Input
                value={searchText}
                placeholder="Search services"
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

export default GovtServicesHeader;
