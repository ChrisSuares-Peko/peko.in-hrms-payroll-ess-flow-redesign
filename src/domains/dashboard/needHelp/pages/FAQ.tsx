import React, { useEffect } from 'react';

import { Col, Collapse, Flex, Row, Skeleton, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import FaqAnswer from '../components/FaqAnswer';
import useFaqApi from '../hooks/useGetFaq';

const useQuery = () => new URLSearchParams(useLocation().search);

const FAQ = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const faqCategory = query.get('faqCategory');

    const { data, isLoading, getAllFaqs } = useFaqApi();

    useEffect(() => {
        if (faqCategory) {
            getAllFaqs(faqCategory);
        } else {
            navigate(paths.dashboard.needHelp);
        }
    }, [faqCategory, getAllFaqs, navigate]);

    if (isLoading) {
        return <Skeleton active avatar />;
    }

    return (
        <Row gutter={24}>
            <Col span={24}>
                <Typography.Paragraph className="text-2xl font-normal text-slate-800">
                    Frequently Asked Questions for {faqCategory}
                </Typography.Paragraph>
            </Col>
            <Col xs={24} lg={12} className="px-4 mt-2">
                {data?.map(item => (
                    <Flex
                        vertical
                        key={item.question}
                        className="border-0 border-b border-solid border-[#D4DBDE] py-6"
                    >
                        <Collapse
                            className="bg-transparent md:mr-5 custom-collapse-panel"
                            size="small"
                            bordered={false}
                            expandIconPosition="end"
                            items={[
                                {
                                    key: item.question,
                                    className: 'faq-collapse-panel',
                                    label: (
                                        <Typography.Text className="text-base font-semibold text-slate-800">
                                            {item.question}
                                        </Typography.Text>
                                    ),
                                    children: (
                                        <Flex vertical className="pt-4 md:pr-14">
                                            <FaqAnswer answer={item.answer} />
                                        </Flex>
                                    ),
                                },
                            ]}
                        />
                    </Flex>
                ))}
            </Col>
        </Row>
    );
};

export default FAQ;
