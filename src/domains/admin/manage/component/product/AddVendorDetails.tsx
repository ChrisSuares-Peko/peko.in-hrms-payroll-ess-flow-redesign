import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Skeleton } from 'antd';
import { ErrorMessage, FieldArray } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';
import SelectInput from '@domains/admin/manage/component/product/SelectInput';

import { vendorDetails } from '../../types/products';

type Props = {
    vendorData: DropDown | undefined;
    values: vendorDetails[];
};

const AddVendorDetails = ({ vendorData, values }: Props) => (
    <Flex vertical justify="end" gap={20}>
        <FieldArray name="vendors">
            {({ push, remove }) => (
                <>
                    {values.length > 0 &&
                        values.map((_, index) => (
                            <Row gutter={[20, 20]} key={index} justify="start" align="middle">
                                <Col xs={10}>
                                    {vendorData ? (
                                        <Flex className="flex-col">
                                            <SelectInput
                                                isRequired
                                                name={`vendors[${index}].id`}
                                                options={vendorData}
                                                placeholder="Please select a vendor"
                                                label="Vendor"
                                                filterOption={false}
                                            />
                                            <ErrorMessage
                                                name={`vendors[${index}].id`}
                                                render={msg => (
                                                    <div className="error-message -mt-6 text-red-500">
                                                        {msg}
                                                    </div>
                                                )}
                                            />
                                        </Flex>
                                    ) : (
                                        <Skeleton.Input active block className="my-2" />
                                    )}
                                </Col>
                                <Col xs={10}>
                                    <Flex className="flex-col">
                                        <TextInput
                                            name={`vendors[${index}].price`}
                                            label="Vendor Price"
                                            type="text"
                                            placeholder="Please enter vendor price "
                                            isRequired
                                            allowNumbersOnly
                                        />
                                        <ErrorMessage
                                            name={`vendors[${index}].price`}
                                            render={msg => (
                                                <div className="error-message -mt-6 text-red-500">
                                                    {msg}
                                                </div>
                                            )}
                                        />
                                    </Flex>
                                </Col>
                                {index > 0 && (
                                    <Col xs={4}>
                                        <DeleteOutlined
                                            onClick={() => remove(index)}
                                            className="text-xl text-bgOrange2 pl-3"
                                        />
                                    </Col>
                                )}
                            </Row>
                        ))}
                </>
            )}
        </FieldArray>
        <FieldArray name="vendors">
            {({ push }) => (
                <Button
                    className="mb-5"
                    danger
                    onClick={() =>
                        push({
                            id: '',
                            name: '',
                            price: '',
                        })
                    }
                >
                    Add Vendor
                </Button>
            )}
        </FieldArray>
    </Flex>
);

export default AddVendorDetails;
