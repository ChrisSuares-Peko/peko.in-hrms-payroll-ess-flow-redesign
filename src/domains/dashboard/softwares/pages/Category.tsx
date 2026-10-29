import { Content } from 'antd/es/layout/layout';

import {
    Header,
    SearchNSort,
    ProductCards,
} from '@src/domains/dashboard/softwares/components/category';

import { CategoryPageProvider } from '../contexts/CategoryPageContext';

const Category = () => (
    <CategoryPageProvider>
        <Content className="mb-20 pt-9">
            <Header />
            <SearchNSort />
            <ProductCards />
        </Content>
    </CategoryPageProvider>
);

export default Category;
