
import { Content } from 'antd/es/layout/layout';

import CalculateCost from '../components/home/CalculateCost';
import DeliveryList from '../components/home/CourierList';
import Header from '../components/home/Header';
import { useCalculateRateApi } from '../hooks/home/useCalculateRateApi';

const Home = () => {
    const {
        handleCalculateRate,
        handleCalculateInternationalRate,
        isLoading,
        data,
        isInital,
        hideAndResetWhileChange,
        isSubmmited,
    } = useCalculateRateApi();

    return (
        <Content className="px-0 mb-8 ">
            <Header />
            <CalculateCost
                handleCalculateRate={handleCalculateRate}
                handleCalculateInternationalRate={handleCalculateInternationalRate}
                isLoading={isLoading}
                hideAndResetWhileChange={hideAndResetWhileChange}
            />
            <DeliveryList data={data} isInital={isInital} isSubmmited={isSubmmited} />
        </Content>
    );
};

export default Home;
