import React from 'react';

import { CheckCircleFilled, CheckOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Grid, Image, Modal, Skeleton, Typography, theme } from 'antd';

import { useTemplateGallery } from '../../hooks/templateGallery/useTemplateGallery';

const TemplateGallery: React.FC = () => {
    const screens = Grid.useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.sm;
    const { templates, selectedId, setSelectedId, isLoading, isSaving, handleUseTemplate } =
        useTemplateGallery();
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const previewTemplate = templates.find(tpl => tpl.id === selectedId);

    if (isLoading) {
        return <Skeleton active style={{ padding: isMobile ? 16 : 24 }} />;
    }

    if (templates.length === 0) {
        return (
            <Flex align="center" justify="center" style={{ width: '100%', minHeight: '100vh' }}>
                <Empty description="No templates available" />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={24} style={{ padding: isMobile ? 16 : 24 }}>
            <Flex
                vertical={isMobile}
                gap={16}
                align={isMobile ? 'stretch' : 'center'}
                justify="space-between"
            >
                <Flex vertical gap={4} style={{ minWidth: 0 }}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Invoice Templates
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Choose how your invoices look - changes apply to all future invoices
                    </Typography.Text>
                </Flex>
                <Button
                    type="primary"
                    danger
                    icon={<CheckCircleFilled />}
                    onClick={handleUseTemplate}
                    loading={isSaving}
                    disabled={!selectedId}
                    block={isMobile}
                >
                    Use this template
                </Button>
            </Flex>

            <Typography.Text strong>Choose a template</Typography.Text>

            <Flex gap={16} style={{ overflowX: 'auto', paddingBottom: 8 }}>
                {templates.map(tpl => {
                    const isSelected = selectedId === tpl.id;

                    return (
                        <Card
                            key={tpl.id}
                            hoverable
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            onClick={() => {
                                setSelectedId(tpl.id);
                                setPreviewOpen(true);
                            }}
                            onKeyDown={event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedId(tpl.id);
                                    setPreviewOpen(true);
                                }
                            }}
                            styles={{ body: { padding: 0 } }}
                            style={{
                                flex: '0 0 auto',
                                width: isMobile ? 'calc(100vw - 32px)' : 288,
                                maxWidth: 288,
                                overflow: 'hidden',
                                borderWidth: 2,
                                borderColor: isSelected
                                    ? token.colorError
                                    : token.colorBorderSecondary,
                                boxShadow: isSelected ? token.boxShadowSecondary : undefined,
                            }}
                        >
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '1 / 1.414',
                                    overflow: 'hidden',
                                    background: token.colorFillAlter,
                                }}
                            >
                                {tpl.imageUrl ? (
                                    <Image
                                        src={tpl.imageUrl}
                                        alt={tpl.subject}
                                        preview={false}
                                        draggable={false}
                                        width="100%"
                                        height="100%"
                                        style={{ display: 'block', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Typography.Text type="secondary">No preview</Typography.Text>
                                )}
                                <Flex
                                    align="center"
                                    justify="center"
                                    style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        border: `2px solid ${
                                            isSelected ? token.colorError : token.colorBorder
                                        }`,
                                        background: isSelected
                                            ? token.colorError
                                            : token.colorBgContainer,
                                    }}
                                >
                                    {isSelected && (
                                        <CheckOutlined
                                            style={{
                                                color: token.colorTextLightSolid,
                                                fontSize: 12,
                                            }}
                                        />
                                    )}
                                </Flex>
                            </Flex>
                            <Flex
                                align="center"
                                style={{
                                    minHeight: 40,
                                    padding: '8px 12px',
                                    background: isSelected
                                        ? token.colorErrorBg
                                        : token.colorBgContainer,
                                }}
                            >
                                <Typography.Text
                                    strong
                                    style={{ color: isSelected ? token.colorErrorText : undefined }}
                                >
                                    {tpl.subject || `Template ${tpl.id}`}
                                </Typography.Text>
                            </Flex>
                        </Card>
                    );
                })}
            </Flex>

            <Modal
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
                centered
                width="auto"
            >
                {previewTemplate?.imageUrl && (
                    <img
                        src={previewTemplate.imageUrl}
                        alt={previewTemplate.subject}
                        style={{ display: 'block', maxWidth: '100%', maxHeight: '85vh' }}
                    />
                )}
            </Modal>
        </Flex>
    );
};

export default TemplateGallery;
