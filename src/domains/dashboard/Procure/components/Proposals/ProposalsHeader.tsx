import React, { useState } from 'react';

import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';

import UploadOfflineProposalModal from './UploadOfflineProposalModal';

type Props = {
    searchText: string;
    onSearch: (val: string) => void;
    onRefresh?: () => void;
};

const ProposalsHeader: React.FC<Props> = ({ searchText, onSearch, onRefresh }) => {
    const [modalOpen, setModalOpen] = useState(false);
    return (
        <>
            <Row gutter={[16, 16]} justify="end" align="middle">
                <Col xs={24} sm={12} md={5}>
                    <Input
                        placeholder="Search"
                        suffix={<SearchOutlined />}
                        allowClear
                        value={searchText}
                        onChange={e => onSearch(e.target.value.replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/gu, ''))}
                        maxLength={100}
                    />
                </Col>
                <Col>
                    <Button
                        type="primary"
                        danger
                        icon={<UploadOutlined />}
                        style={{ borderRadius: 8 }}
                        onClick={() => setModalOpen(true)}
                    >
                        Upload Proposal
                    </Button>
                </Col>
            </Row>
            <UploadOfflineProposalModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={onRefresh} />
        </>
    );
};

export default ProposalsHeader;
