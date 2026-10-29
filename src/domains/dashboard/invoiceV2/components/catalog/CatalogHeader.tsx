import React from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Grid, Input, Typography } from 'antd';
import type { Dayjs } from 'dayjs';

interface CatalogHeaderProps {
    search: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    range: [Dayjs, Dayjs] | null;
    onRangeChange: (v: [Dayjs, Dayjs] | null) => void;
    onAddNew: () => void;
}

const CatalogHeader = ({ search, onChange, range, onRangeChange, onAddNew }: CatalogHeaderProps) => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;

    return (
        <Flex vertical gap={16} className="mb-5">
            <Flex vertical={isMobile} justify="space-between" align={isMobile ? 'flex-start' : 'center'} gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-xl font-semibold text-[#101828]">
                        Catalog
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#6A7282]">
                        Products with pricing and GST defaults.
                    </Typography.Text>
                </Flex>

                <Flex wrap="wrap" gap={8} className={isMobile ? 'w-full' : ''}>
                    <DatePicker.RangePicker
                        value={range}
                        onChange={vals =>
                            onRangeChange(
                                vals && vals[0] && vals[1]
                                    ? ([vals[0], vals[1]] as unknown as [Dayjs, Dayjs])
                                    : null
                            )
                        }
                        className={isMobile ? '!w-full' : '!w-64'}
                    />
                    <Input
                        value={search}
                        placeholder="Search catalog..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        onChange={onChange}
                        allowClear
                        className={isMobile ? '!w-full' : '!w-56'}
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        onClick={onAddNew}
                        className={isMobile ? '!w-full' : ''}
                    >
                        Add Product
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default CatalogHeader;
