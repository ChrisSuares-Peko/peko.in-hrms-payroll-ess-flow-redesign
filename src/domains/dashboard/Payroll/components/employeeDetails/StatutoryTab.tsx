import React from 'react';

import { Col, Row, Skeleton } from 'antd';
import { useLocation } from 'react-router-dom';

import EpfStatutoryCard from './tabs/EpfStatutoryCard';
import EsiStatutoryCard from './tabs/EsiStatutoryCard';
import LwfStatutoryCard from './tabs/LwfStatutoryCard';
import ProfessionalTaxStatutoryCard from './tabs/ProfessionalTaxStatutoryCard';
import TdsStatutoryCard from './tabs/TdsStatutoryCard';
import useEmployeeStatutoryDetails, { LwfConfig } from '../../hooks/employeeProfileHooks/useEmployeeStatutoryDetails';

interface StatutoryTabProps {
    employeeData?: any;
    onNavigateToBasicInfo?: () => void;
}

const StatutoryTab = ({ employeeData, onNavigateToBasicInfo }: StatutoryTabProps) => {
    const location = useLocation();
    const { employeeId } = location.state;

    const employeeName = employeeData?.personalInformation?.fullName || 'this employee';
    const employeeCode = employeeData?.employeeInformation?.employeeId || '—';

    const { data, updateEmployeeStatutoryData, buttonLoader, isLoading, refetch } =
        useEmployeeStatutoryDetails(employeeId);

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 5 }} />;
    }

    return (
        <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
                <EpfStatutoryCard
                    data={data.epf}
                    toggleLoading={buttonLoader.epf}
                    onToggle={checked => updateEmployeeStatutoryData('enableEPF', checked, 'epf')}
                    onUpdateUan={value => updateEmployeeStatutoryData('epfUAN', value, 'epf')}
                />
            </Col>
            <Col xs={24} md={12}>
                <EsiStatutoryCard
                    data={data.esi}
                    toggleLoading={buttonLoader.esi}
                    onToggle={checked => updateEmployeeStatutoryData('enableESI', checked, 'esi')}
                    onUpdateEsiNumber={value => updateEmployeeStatutoryData('esiNumber', value, 'esi')}
                />
            </Col>
            <Col xs={24} md={12}>
                <TdsStatutoryCard
                    data={data.tds}
                    onNavigateToBasicInfo={() => onNavigateToBasicInfo?.()}
                />
            </Col>
            <Col xs={24} md={12}>
                <ProfessionalTaxStatutoryCard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    employeeCode={employeeCode}
                    data={data.professionalTax}
                    toggleLoading={buttonLoader.professionalTax}
                    onToggle={checked => updateEmployeeStatutoryData('professionalTax', checked, 'professionalTax')}
                    onAmountUpdated={refetch}
                />
            </Col>
            <Col xs={24} md={12}>
                <LwfStatutoryCard
                    employeeName={employeeName}
                    data={data.lwf}
                    toggleLoading={buttonLoader.lwf}
                    isSaving={buttonLoader.lwfConfig}
                    onToggle={checked => updateEmployeeStatutoryData('laborWelfareFund', checked, 'lwf')}
                    onSaveConfig={(config: LwfConfig) => updateEmployeeStatutoryData('lwf', config, 'lwfConfig')}
                />
            </Col>
        </Row>
    );
};

export default StatutoryTab;
