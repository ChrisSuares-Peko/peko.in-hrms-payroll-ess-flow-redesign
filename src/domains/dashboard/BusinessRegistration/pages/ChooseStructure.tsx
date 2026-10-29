import { useCallback, useEffect, useState } from 'react';

import { Button, Empty, Flex, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getCatalog } from '../api';
import StructureCard from '../components/StructureCard';
import { clearCurrentApplication, updateApplicationData } from '../slices/businessRegistrationSlice';
import { buildStructures, parseCatalogList } from '../utils/catalog';
import { buildRegisterPath, BusinessStructure, CHOOSE_STRUCTURE_TITLE } from '../utils/data';

const { Title } = Typography;

const ChooseStructure = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [structures, setStructures] = useState<BusinessStructure[]>([]);
    const [loading, setLoading] = useState(true);

    // Structures render only from the published catalog — no hardcoded fallback.
    const fetchCatalog = useCallback(() => {
        let active = true;
        setLoading(true);
        getCatalog({ userId: Number(userId), userType: userType ?? '' }).then(res => {
            if (!active) return;
            const list = parseCatalogList(res);
            setStructures(list.length ? buildStructures(list) : []);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType]);

    useEffect(() => fetchCatalog(), [fetchCatalog]);

    const handleSelect = (structure: BusinessStructure) => {
        // A structure card always starts a NEW application — clear any prior draft
        // so the form is blank. An in-progress draft stays resumable from My
        // Applications (which sets the draft + applicationId itself).
        dispatch(clearCurrentApplication());
        dispatch(updateApplicationData({ entityType: structure.type }));
        navigate(buildRegisterPath(structure.type));
    };

    const renderContent = () => {
        if (loading)
            return (
                <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
                    <Spin size="large" />
                </Flex>
            );
        if (!structures.length)
            return (
                <Flex vertical justify="center" align="center" gap={16} style={{ minHeight: '60vh' }}>
                    <Empty description="We couldn't load the business structures right now. Please try again." />
                    <Button type="primary" onClick={fetchCatalog}>
                        Retry
                    </Button>
                </Flex>
            );
        return (
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-6 mt-6 sm:mt-8">
                {structures.map(structure => (
                    <StructureCard key={structure.type} structure={structure} onSelect={handleSelect} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-[1550px] mx-auto">
                {/* "My applications" moved to the Landing hero (23-07) — shown
                    there only when the corporate has applications. */}
                <Title
                    level={2}
                    className="!text-[24px] sm:!text-[28px] !font-bold !text-[#1e293b] !mb-0 !leading-tight"
                >
                    {CHOOSE_STRUCTURE_TITLE}
                </Title>

                {renderContent()}
            </div>
        </div>
    );
};

export default ChooseStructure;
