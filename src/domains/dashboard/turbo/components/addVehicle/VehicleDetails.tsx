import { useState } from 'react';

import { Row } from 'antd';
import dayjs from 'dayjs';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import ComplianceFlagsCard from './ComplianceFlagsCard';
import FastagSection from './FastagSection';
import InsurancePucCard from './InsurancePucCard';
import OwnerInfoCard from './OwnerInfoCard';
import QuoteSuccessModal from './QuoteSuccessModal';
import RequestQuoteModal from './RequestQuoteModal';
import TechnicalDetailsCard from './TechnicalDetailsCard';
import UpdateServiceDatesModal from './UpdateServiceDatesModal';
import useVehicleActions from './useVehicleActions';
import useVehicleData from './useVehicleData';
import { capitalizeFirstLetter, isFastagApplicable } from './vehicleDetailsHelpers';
import VehicleSummaryCard from './VehicleSummaryCard';
import useRefreshVehicle from '../../hooks/useRefreshVehicle';
import useVehicleDocuments from '../../hooks/useVehicleDocuments';

const VehicleDetails = ({ inputParams, verifyRcResponse, id, setRefresh }: any) => {
    // FASTag details picked before the vehicle is in the fleet; saved on Add Vehicle.
    const [fastagSelection, setFastagSelection] = useState<any>(null);

    const {
        vehicleDetails,
        registrationAndTaxDetails,
        insuranceAndPucDetails,
        technicalDetails,
        complianceLegalFlags,
        ownerInfo,
    } = useVehicleData(verifyRcResponse);

    const {
        loading,
        serviceDatesLoading,
        quoteLoading,
        openConfirmationModal,
        setOpenConfirmationModal,
        openServiceDatesModal,
        setOpenServiceDatesModal,
        openQuoteModal,
        setOpenQuoteModal,
        openQuoteSuccessModal,
        setOpenQuoteSuccessModal,
        quoteMessage,
        handleDelete,
        handleSaveServiceDates,
        handleSubmitQuote,
        handleSubmit,
    } = useVehicleActions({ inputParams, verifyRcResponse, id, setRefresh, fastagSelection });

    const { insuranceDoc, pucDoc, saveDoc } = useVehicleDocuments(id);

    // Ticket 31321: a refresh rewrites the stored RC fields, so re-read the vehicle afterwards.
    const { refreshVehicle, refreshingId } = useRefreshVehicle(() => setRefresh?.(true));

    return (
        <>
            <VehicleSummaryCard
                verifyRcResponse={verifyRcResponse}
                id={id}
                loading={loading}
                vehicleDetails={vehicleDetails}
                registrationAndTaxDetails={registrationAndTaxDetails}
                onDelete={() => setOpenConfirmationModal(true)}
                onAddVehicle={handleSubmit}
                onEditServiceDates={() => setOpenServiceDatesModal(true)}
                onRefresh={() =>
                    refreshVehicle({ id, lastRefreshedAt: verifyRcResponse?.lastRefreshedAt })
                }
                isRefreshing={refreshingId === id}
            />

            <Row gutter={[30, 30]} className="mt-7">
                <InsurancePucCard
                    insuranceAndPucDetails={insuranceAndPucDetails}
                    onRequestQuote={() => setOpenQuoteModal(true)}
                    insuranceDoc={insuranceDoc}
                    pucDoc={pucDoc}
                    insuranceExpiry={verifyRcResponse?.insuranceValidUpto}
                    pucExpiry={verifyRcResponse?.pucValidUpto}
                    saveDoc={saveDoc}
                />
                <OwnerInfoCard ownerInfo={ownerInfo} verifyRcResponse={verifyRcResponse} />
            </Row>

            <Row gutter={[30, 30]} className="mt-7">
                <TechnicalDetailsCard technicalDetails={technicalDetails} />
                <ComplianceFlagsCard complianceLegalFlags={complianceLegalFlags} />
                {openConfirmationModal && (
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this vehicle? This action will permanently remove the vehicle and its associated data (e.g., documents, driver assignment) from your fleet."
                        handleSubmit={handleDelete}
                        isLoading={false}
                    />
                )}
            </Row>

            {isFastagApplicable(verifyRcResponse?.rawData?.class) && (
                <FastagSection
                    verifyRcResponse={verifyRcResponse}
                    id={id}
                    onSelectionChange={id ? undefined : setFastagSelection}
                />
            )}

            {openServiceDatesModal && (
                <UpdateServiceDatesModal
                    open={openServiceDatesModal}
                    handleCancel={() => setOpenServiceDatesModal(false)}
                    handleSubmit={handleSaveServiceDates}
                    isLoading={serviceDatesLoading}
                    initialValues={{
                        lastServiceDate: verifyRcResponse?.lastServiceDate
                            ? dayjs(verifyRcResponse.lastServiceDate).format('YYYY-MM-DD')
                            : '',
                        nextServiceDue: verifyRcResponse?.nextServiceDue
                            ? dayjs(verifyRcResponse.nextServiceDue).format('YYYY-MM-DD')
                            : '',
                    }}
                />
            )}

            {openQuoteModal && (
                <RequestQuoteModal
                    open={openQuoteModal}
                    handleCancel={() => setOpenQuoteModal(false)}
                    handleSubmit={handleSubmitQuote}
                    isLoading={quoteLoading}
                    vehicleNumber={verifyRcResponse?.vehicleNumber}
                    initialValues={{
                        fullName: capitalizeFirstLetter(verifyRcResponse?.ownerName) || '',
                    }}
                />
            )}

            {openQuoteSuccessModal && (
                <QuoteSuccessModal
                    open={openQuoteSuccessModal}
                    handleClose={() => setOpenQuoteSuccessModal(false)}
                    message={quoteMessage}
                />
            )}
        </>
    );
};

export default VehicleDetails;
