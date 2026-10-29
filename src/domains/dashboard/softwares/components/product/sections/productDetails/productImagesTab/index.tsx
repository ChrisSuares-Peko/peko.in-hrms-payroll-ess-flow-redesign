import { Col, Empty, Image, Row } from 'antd';

import defaultProductIntegrationImage from '@src/domains/dashboard/softwares/assets/images/defaultProductIntegrationImage.svg';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const ProductImagesTab = () => {
    const { product } = useProductContext();

    const snapshots = product?.snapshots;

    if (!snapshots || snapshots.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <Row gutter={[10, 10]} className=" w-full min-h-96" align="stretch" justify="center">
            {snapshots.map(el => (
                <Col key={el._id} xs={24} sm={12} md={8} xxl={6}>
                    <div className="aspect-video overflow-hidden rounded-lg">
                        <Image
                            src={el.Location}
                            fallback={defaultProductIntegrationImage}
                            alt={el.name}
                            preview
                            className="!w-full !h-full !object-cover !block"
                            wrapperClassName="!w-full !h-full !block"
                        />
                    </div>
                </Col>
            ))}
        </Row>
    );
};

export default ProductImagesTab;
