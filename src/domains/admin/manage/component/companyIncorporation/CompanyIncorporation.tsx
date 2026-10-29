import { useState } from 'react';

import { SettingOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex } from 'antd';

import CompanyIncorporationReport from '@src/domains/admin/reports/components/CompanyIncorporation';
import CompanyIncorporationConfig from '@src/domains/admin/settings/component/companyIncorporation/CompanyIncorporationConfig';

const CompanyIncorporation = () => {
    const [configOpen, setConfigOpen] = useState(false);

    return (
        <Flex vertical gap={20}>
            <Flex justify="end" className="w-full">
                <Button
                    type="primary"
                    danger
                    icon={<SettingOutlined />}
                    onClick={() => setConfigOpen(true)}
                >
                    Configure Pricing
                </Button>
            </Flex>

            <CompanyIncorporationReport />

            <Drawer
                title="Pricing Configuration"
                placement="right"
                width={720}
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                destroyOnClose
            >
                <CompanyIncorporationConfig />
            </Drawer>
        </Flex>
    );
};

export default CompanyIncorporation;
