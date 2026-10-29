import React, { useState } from 'react';

import { Col, Typography, Flex, List, Row, Tabs, Pagination } from 'antd';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import CopySVG from '../../assets/icons/Copy.svg';
import useFilter from '../../hooks/useFilters';
import useGetTopUpList from '../../hooks/useGetTopUpList';
import { topUpHistoryColumns } from '../../utils/TopUpHistory';

type Props = {
    countryName: string;
    esim: string;
    esimState?: string;
    purchasedFor?: string;
};

const AdditionalInfoTab = ({ countryName, esim, esimState, purchasedFor }: Props) => {
    const dispatch = useAppDispatch();
    // const { iccid } = useLocation().state;
    const location = useLocation();
    const iccid = location.state?.iccid || JSON.parse(sessionStorage.getItem('ESIM') || '{}').iccid;

    const [filter, setFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 5,
    });
    const { handlePageChange } = useFilter({ setFilters });

    const { isLoading, topUpdata, totalRecord } = useGetTopUpList(
        filter.itemsPerPage,
        filter.page,
        filter.searchText,
        iccid
    );

    const additionalInfo = [
        {
            title: 'Coverage',
            content: countryName ?? 'N/A',
        },
        {
            title: 'ICCID Number',
            content: esim ?? 'N/A',
        },
        ...(purchasedFor
            ? [
                  {
                      title: 'Purchased For',
                      content: purchasedFor,
                  },
              ]
            : []),
        ...(esimState
            ? [
                  {
                      title: 'eSIM Status',
                      content: esimState.charAt(0) + esimState.slice(1).toLowerCase(),
                  },
              ]
            : []),
    ];

    const handleCopyClick = (text: string) => {
        navigator.clipboard.writeText(text);
        dispatch(
            showToast({
                description: 'ICCID copied to clipboard',
                variant: 'success',
            })
        );
    };

    return (
        <Col className="" span={24}>
            <Tabs
                defaultActiveKey="1"
                items={[
                    {
                        key: '1',
                        label: 'Information',
                        children: (
                            <Flex vertical className="w-full">
                                <List
                                    className=""
                                    dataSource={additionalInfo}
                                    renderItem={(item, index) => (
                                        <Row
                                            className={`py-3 px-4 
                            ${index % 2 === 0 ? 'bg-listBg' : 'bg-white'} 
                            ${index === additionalInfo.length - 1 ? '' : 'border-none'} 
                            rounded-md`}
                                        >
                                            <Col span={24}>
                                                <Flex
                                                    justify="start"
                                                    className="items-center w-full"
                                                >
                                                    <Typography.Text className="text-gray-600 text-sm w-2/5 mdInstallation Guidelines :w-1/4">
                                                        <Flex gap={10} align="center">
                                                            {item?.title}
                                                            {item?.title === 'ICCID Number' && (
                                                                <ReactSVG
                                                                    data-testid="copy-icon"
                                                                    className="cursor-pointer"
                                                                    src={CopySVG}
                                                                    beforeInjection={svg => {
                                                                        svg.setAttribute(
                                                                            'style',
                                                                            'width: 25px; height: 25px;'
                                                                        );
                                                                    }}
                                                                    onClick={() =>
                                                                        handleCopyClick(
                                                                            item?.content!.toString()
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </Flex>
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className={`${
                                                            item?.title === 'ICCID Number'
                                                                ? 'text-red-500'
                                                                : 'text-gray-600'
                                                        } text-sm w-2/3 md:w-3/4 text-left flex items-center space-x-2`}
                                                    >
                                                        {item?.content}
                                                    </Typography.Text>
                                                </Flex>
                                            </Col>
                                        </Row>
                                    )}
                                />
                            </Flex>
                        ),
                    },
                    {
                        key: '2',
                        label: 'Top-Up History',
                        children: (
                            <Flex vertical className="">
                                <GenericTable
                                    rowKey={record => record.id}
                                    bordered={false}
                                    size="middle"
                                    columns={topUpHistoryColumns}
                                    dataSource={topUpdata}
                                    pagination={false}
                                    loading={isLoading}
                                />

                                <Pagination
                                    className="sm:text-end text-center mt-10"
                                    current={filter.page}
                                    size="small"
                                    total={totalRecord}
                                    pageSize={filter.itemsPerPage}
                                    style={{ display: 'block' }}
                                    onChange={(page, pageSize) => {
                                        if (page !== filter.page) handlePageChange(page, pageSize);
                                        else handlePageChange(1, pageSize);
                                    }}
                                />
                            </Flex>
                        ),
                    },
                ]}
            />
        </Col>
    );
};

export default AdditionalInfoTab;
