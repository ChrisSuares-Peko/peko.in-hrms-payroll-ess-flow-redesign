import { Col, Row } from 'antd';

import ReminderCard from './ReminderCard';
import { ReminderCarouselProps } from '../../types/dash/index';

const ReminderCarousel = ({ arr }: ReminderCarouselProps) => (
    <Row className="w-full  mt-6 ">
        {arr.map((item, j) => (
            <Col
                key={j}
                // eslint-disable-next-line no-nested-ternary
                className={`min-h-24 w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/4 xxl:w-1/5 ${j === 0 ? 'pl-0 md:pl-0 xl:pl-0' : j === 4 ? 'pr-0 md:pr-0 xl:pr-0' : ''} p-1 md:p-2 xl:p-3`}
            >
                <ReminderCard
                    title={item.title}
                    subTitle={item.subTitle}
                    icon={item.icon}
                    date={item.date}
                    type={item.type}
                    key={j}
                />
            </Col>
        ))}
    </Row>
);

export default ReminderCarousel;
