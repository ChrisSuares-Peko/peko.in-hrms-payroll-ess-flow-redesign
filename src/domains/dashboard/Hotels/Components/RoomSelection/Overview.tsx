import { useState } from 'react';

import { Typography,  Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import Facilities from './Rooms/Facilities';
import RightCircle from '../../Assets/icons/RightCircle.svg';


interface desc {
    description?: string;
    facilities?: any;
    suppliments?: any;
}
const Overview = ({ description, facilities, suppliments }: desc) => {
    const cleanDescription = description?.replace(/<p>HeadLine\s*:\s*.*?<\/p>/, '') || '';
    const [view, setView] = useState(false);
    

    return (
        <Content className="pt-5">
            <Content>
                <Typography.Text className="font-medium text-base">About Property</Typography.Text>
                <Typography
                    dangerouslySetInnerHTML={{ __html: cleanDescription! }}
                    className="mt-3 text-justify"
                    style={{ lineHeight: '1.5' }}
                />
            </Content>
          
            <Flex gap={5} className="mt-3 cursor-pointer w-24" onClick={() => setView(!view)}>
                <Typography className="mt-2 font-bold text-md">
                    {!view ? 'Show more' : 'Show less'}
                </Typography>
                <ReactSVG
                    className={`mt-[10px] transition-transform duration-300 ${view ? 'rotate-90' : 'rotate-0'}`}
                    src={RightCircle}
                />
            </Flex>

            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    view ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <Facilities facilities={facilities} setView={setView} view={view} />
            </div>
        </Content>
    );
};

export default Overview;
