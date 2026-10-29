import React, { useEffect } from 'react';

import { Button, Flex, Skeleton } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import InvoiceCard from '../components/InvoiceCard';
import useGetInvoiceDetails from '../hooks/useGetInvoiceDetails';
import { setDetails } from '../slices/InvoiceSlices';

const InvoicePreview = () => {
    const { invoiceResponse } = useAppSelector(store => store.reducer.invoices);
    const { data, dataSource, isLoading } = useGetInvoiceDetails(invoiceResponse.id);
    const componentRef = React.useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setDetails(data));
    }, [data, dispatch]);

    return isLoading ? (
        <Flex vertical gap={20} justify="center" align="center" className="w-full ">
            <Skeleton className="mt-10 md:w-3/4" paragraph={{ rows: 15 }} />
        </Flex>
    ) : (
        <Flex
            vertical
            gap={20}
            justify="center"
            align="center"
            className="w-full bg-gray-100 py-2 px-2 sm:py-5 sm:px-5 md:py-10 rounded-md sm:rounded-3xl"
        >
            <InvoiceCard data={data} componentRef={componentRef} dataSource={dataSource} />
            <Flex justify="space-between" align="center" className="w-full md:max-w-3xl mt-3">
                <Button
                    type="primary"
                    className="md:px-10"
                    danger
                    onClick={() => navigate(paths.invoice.guidelines, { state: data })}
                >
                    Proceed
                </Button>
            </Flex>
        </Flex>
    );
};

export default InvoicePreview;
