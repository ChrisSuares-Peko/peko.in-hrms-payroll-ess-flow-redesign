import { Col, Row, Select, Skeleton, Typography } from 'antd';

import AccountingIcon from '@src/assets/icons/Accounts.svg';

import DownArrow from '../../../assets/icons/DownArrow.svg';
import '../../../assets/styles/styles.css';
import { useCategoryPageContext } from '../../../contexts/CategoryPageContext';

const { Text } = Typography;

const Header = () => {
    const {
        categoryList,
        labeledCategories,
        currentCategory,
        handleCategoryChange,
        categoryIsLoading,
    } = useCategoryPageContext();

    return (
        <Row gutter={[10, 10]} align="middle">
            {categoryIsLoading ? (
                <Skeleton />
            ) : (
                <>
                    {' '}
                    <Col xs={24}>
                        <Select
                            value={currentCategory}
                            onChange={handleCategoryChange}
                            options={labeledCategories}
                            suffixIcon={
                                <img
                                    src={DownArrow}
                                    alt="filter"
                                    className="custom-select-arrow-icon"
                                />
                            }
                            className="custom-header-select"
                            popupClassName="custom-header-dropdown"
                            virtual={false}
                            optionRender={option => (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={
                                            (option.data as { icon: string }).icon || AccountingIcon
                                        }
                                        alt={option.label as string}
                                        className="w-6 h-6 object-contain"
                                    />
                                    <span>{option.label}</span>
                                </div>
                            )}
                        />
                    </Col>
                    <Col>
                        <Text className="font-normal text-base text-[#868686]">
                            {categoryList.find(cat => cat.weburl === currentCategory)?.title}
                        </Text>
                    </Col>
                </>
            )}
        </Row>
    );
};

export default Header;
