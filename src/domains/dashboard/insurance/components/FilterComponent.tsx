import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import {
    Card,
    Checkbox,
    Col,
    Flex,
    InputNumber,
    Radio,
    Row,
    Slider,
    Space,
    Typography,
} from 'antd';

import AddonsDrawer from './AddonsDrawer';
import { claimRate, insuranceCompanies } from '../utils/data';

interface FilterProps {
    drawerFilterName?: string;
    isHealthDrawer?: boolean;
}
const FilterComponent: React.FC<FilterProps> = ({ drawerFilterName, isHealthDrawer }) => {
    const [startValue, setStartValue] = useState<number>(1);
    const [endValue, setEndValue] = useState<number>(10);
    const [openAddonsDrawer, setOpenAddonsDrawer] = useState<boolean>(false);
    const onChange = (values: [number, number]) => {
        setStartValue(values[0]);
        setEndValue(values[1]);
    };

    return (
        <Card
            styles={{ body: { padding: 20 } }}
            className="rounded-xl border-2 border-gray-200 sticky top-0"
        >
            <Flex justify="space-between">
                <Typography.Text className="text-lg font-bold leading-6">Filter</Typography.Text>
                <Typography.Link type="danger" className="text-primaryOrange font-normal leading-6">
                    Reset
                </Typography.Link>
            </Flex>
            <Flex vertical className="my-5 gap-3">
                <Typography.Text className="text-base font-medium leading-6">
                    Sort by
                </Typography.Text>

                <Radio.Group>
                    <Space direction="vertical">
                        <Radio value={1}>Recommended</Radio>
                        <Radio value={2}> Low to High</Radio>
                        <Radio value={3}> High to Low</Radio>
                    </Space>
                </Radio.Group>
            </Flex>
            <Flex vertical className="my-5 gap-3">
                <Typography.Text className="text-base font-medium leading-6">Price</Typography.Text>
                <Slider
                    range
                    onChange={values => onChange(values as [number, number])}
                    value={[startValue, endValue]}
                    max={10000}
                />
                <Row className="gap-3">
                    <Col sm={24} className="border-2 p-2 flex-1 flex-col">
                        <Typography.Text className="text-neutral-400 text-base font-normal leading-6 mx-2">
                            min price
                        </Typography.Text>
                        <InputNumber
                            min={1}
                            className="border-none text-xl font-bold py-0"
                            value={startValue ?? 0}
                            onChange={value => setStartValue(value !== null ? value : 1)}
                            size="small"
                            controls={false}
                        />
                    </Col>
                    <Col sm={24} className="border-2 p-2 pr-0 flex-1 flex-col">
                        <Typography.Text className="text-neutral-400 text-base font-normal leading-6 mx-2">
                            max price
                        </Typography.Text>
                        <InputNumber
                            className="border-none text-gray-500 outline-none text-xl font-bold py-0 w-full"
                            min={1}
                            max={100}
                            value={endValue ?? 10}
                            onChange={value => setEndValue(value !== null ? value : 10)}
                            controls={false}
                            size="small"
                        />
                    </Col>
                </Row>
            </Flex>
            <Row className="mt-">
                <Typography.Text className="text-base font-medium leading-6">
                    Claim Approval Rate
                </Typography.Text>
            </Row>
            {claimRate &&
                claimRate.map(({ label, count }, i) => (
                    <Row className="my-3" justify="space-between" key={i}>
                        <Checkbox className=" text-textLightGray">{label}</Checkbox>
                        <Typography.Text>{count}</Typography.Text>
                    </Row>
                ))}
            <Row className="mt-6">
                <Typography.Text className="text-base font-medium leading-6">
                    Insurer Type
                </Typography.Text>
            </Row>
            {['Private Sector', 'Public Sector'].map((item, i) => (
                <Row className="my-3" justify="space-between" key={i}>
                    <Checkbox className=" text-textLightGray">{item}</Checkbox>
                </Row>
            ))}

            <Flex
                className="mt-6 cursor-pointer"
                justify="space-between"
                onClick={() => setOpenAddonsDrawer(true)}
            >
                <Typography.Text className="text-base font-medium ">
                    {drawerFilterName ?? 'Addons'}
                </Typography.Text>
                <RightOutlined className="text-xl" />
            </Flex>

            <Row className="mt-6">
                <Typography.Text className="text-base font-medium leading-6">
                    Insurer
                </Typography.Text>
            </Row>

            {insuranceCompanies &&
                insuranceCompanies.map(({ label }, i) => (
                    <Row className="my-3" justify="space-between" key={i}>
                        <Checkbox className=" text-textLightGray">{label}</Checkbox>
                    </Row>
                ))}
            <AddonsDrawer
                open={openAddonsDrawer}
                handleClose={() => setOpenAddonsDrawer(!openAddonsDrawer)}
                isHealthDrawer={isHealthDrawer}
            />
        </Card>
    );
};

export default FilterComponent;
