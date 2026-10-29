import { Button, Col, Flex, Row, Spin, Typography } from 'antd';

import FastagDetails from './FastagDetails';
import FastagForm from './FastagForm';
import useFastag from './useFastag';

interface FastagSectionProps {
    verifyRcResponse: any;
    id?: number;
    onSelectionChange?: (selection: any) => void;
}

const FastagSection = ({ verifyRcResponse, id, onSelectionChange }: FastagSectionProps) => {
    const f = useFastag({ verifyRcResponse, id, onSelectionChange });

    const renderBody = () => {
        if (f.showForm)
            return <FastagForm {...f} onSubmit={f.handleSubmit} showSubmit={Boolean(id)} />;
        if (f.fetching) {
            return (
                <Flex
                    justify="center"
                    align="center"
                    className="w-full mt-6"
                    style={{ minHeight: 80 }}
                >
                    <Spin />
                </Flex>
            );
        }
        if (f.fetchError) {
            return (
                <Flex justify="space-between" align="center" className="w-full mt-4">
                    <Typography.Text type="secondary">
                        Unable to fetch FASTag details right now.
                    </Typography.Text>
                    <Button danger onClick={f.handleChangeProvider}>
                        Change Provider
                    </Button>
                </Flex>
            );
        }
        return (
            <FastagDetails
                billData={f.billData}
                verifyRcResponse={verifyRcResponse}
                providerLabel={f.providerLabel}
                onChangeProvider={f.handleChangeProvider}
                onRecharge={f.handleRecharge}
                rechargeLoading={f.rechargeLoading}
            />
        );
    };

    return (
        <Row gutter={[30, 30]} className="mt-7">
            <Col xs={24}>
                <div className="h-full p-6 border rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                    <Typography.Text className="text-sm font-semibold">FASTag</Typography.Text>
                    {renderBody()}
                </div>
            </Col>
        </Row>
    );
};

export default FastagSection;
