import { Content } from 'antd/es/layout/layout';

import {
    Hero,
    Header,
    Categories,
    PopularProducts,
} from '@src/domains/dashboard/softwares/components/home';

import useResetQueryParams from '../hooks/general/useResetQueryParams';
import useResetRecommendedProducts from '../hooks/general/useResetRecommendedProducts';

const HomePage = () => {
    useResetQueryParams();
    useResetRecommendedProducts();
    return (
        <Content className="mb-20">
            <Header />
            <Hero />
            <Categories />
            <PopularProducts />
        </Content>
    );
};

export default HomePage;
