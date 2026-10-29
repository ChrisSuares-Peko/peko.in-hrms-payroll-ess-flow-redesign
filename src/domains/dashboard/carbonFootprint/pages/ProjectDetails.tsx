import { Col, Image, Row, Typography, Skeleton, TabsProps, Tabs, Flex, Empty } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useParams } from 'react-router-dom';

import '@domains/dashboard/carbonFootprint/assets/styles.css';

import useScreenSize from '@src/hooks/useScreenSize';

import Header from '../components/projectDetails/Header';
import useGetProjectDetails from '../hooks/useGetProjectDetails';

const { Text } = Typography;

const ProjectDetails = () => {
    const { md } = useScreenSize();

    const size = md ? 'large' : 'small';
    const { id } = useParams();
    const { projectData, isLoading } = useGetProjectDetails(id);
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Project Summary',
            children: (
                <Text className="font-light text-base  text-start">
                    {projectData && (
                        <Content
                            className="htmlContent"
                            dangerouslySetInnerHTML={{ __html: projectData.body.html }}
                        />
                    )}
                </Text>
            ),
        },
        {
            key: '2',
            label: 'UN Goals',
            children:
                projectData!?.ProjectGoalsAssociation.length > 0 ? (
                    <Row gutter={[20, 20]} className="">
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, index) => (
                                  <Skeleton.Button
                                      key={index}
                                      shape="square"
                                      style={{ height: '4rem', width: '4rem' }}
                                      className="w-full"
                                      active={isLoading}
                                      size="large"
                                  />
                              ))
                            : projectData?.ProjectGoalsAssociation.map((item, i) => (
                                  <Col xs={8} sm={4} md={4} lg={3} xl={2} key={i}>
                                      <Image
                                          loading="lazy"
                                          key={i}
                                          preview={false}
                                          src={item.logo}
                                          width={90}
                                          height={90}
                                          className="rounded-xl object-contain"
                                      />
                                  </Col>
                              ))}
                    </Row>
                ) : (
                    <Flex justify="center" align="center" className="mt-5">
                        <Empty description="No data found" />
                    </Flex>
                ),
        },
        {
            key: '3',
            label: 'Project Images',
            children:
                projectData!?.photos.length > 0 ? (
                    <Row gutter={[20, 20]}>
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, index) => (
                                  <Skeleton.Button
                                      key={index}
                                      shape="square"
                                      style={{ height: '8rem', width: '8rem' }}
                                      className="w-full"
                                      active={isLoading}
                                      size="large"
                                  />
                              ))
                            : projectData?.photos.map((item, i) => (
                                  <Col xs={24} md={12} lg={6} key={i}>
                                      <Image
                                          loading="eager"
                                          preview
                                          src={item.projectImageUrl}
                                          className="rounded-xl object-cover"
                                      />
                                  </Col>
                              ))}
                    </Row>
                ) : (
                    <Flex justify="center" align="center" className="mt-5">
                        <Empty description="No project images found" />
                    </Flex>
                ),
        },
    ];
    return (
        <Row gutter={[20, 20]} className="xs:mx-0 md:mt-10 md:mx-0 lg:mx-14 ">
            <Col xs={24} md={24}>
                <Header id={id} isLoading={isLoading} projectData={projectData} />
            </Col>
            <Col xs={24} md={24}>
                <Tabs size={size} defaultActiveKey="1" items={items} />
            </Col>

            {isLoading && (
                <Col xs={24}>
                    <Skeleton active title={false} paragraph={{ rows: 10 }} />
                </Col>
            )}
        </Row>
    );
};
export default ProjectDetails;
