export interface FleetInfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    bgColor: string;
}
export interface userPayload {
    userType: string;
    userId: number;
}
export interface FleetListingPayload extends userPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
}

interface Vehicle {
    id: number;
    vehicleName: string;
    vehicleType: string;
    vehicleNumber: string;
    purchasedDate: string;
    assetType: string;
    dateOfRenewal: string;
    amount: string;
    amountRecurring: null | string;
    vendor: null | string;
    modelYear: null | string;
    chassisNumber: null | string;
    engineTransmission: null | string;
    odoMeter: null | string;
    createdAt: string;
    updatedAt: string;
    status: string;
    cloudEmployeeId: number;
    cloud_employee: {
        id: number;
        employeeName: string;
        employeeEmail: string;
        department: string;
        joiningDate: string;
        used: string;
        usingFor: string;
    };
}
export interface FleetListingResponse {
    result: Vehicle[];
    totalData: number;
}
export interface FleetInfoResponse {
    totalFleet: number;
    totalAssigned: number;
    totalUnused: number;
    onMaintenance: number;
}
export interface VehicleCreatePayload extends userPayload {
    cloudEmployeeId: number;
    vehicleName: string;
    vehicleType: string;
    vehicleNumber: string;
    purchasedDate: string;
    dateOfRenewal: string;
    assetType: string;
    amount: string;
    amountRecurring?: string;
    vendor?: string;
    batchNumber?: string;
    modelYear?: string;
    chassisNumber?: string;
    engineTransmission?: string;
    odoMeter?: string;
}
interface VehicleDetails {
    id: number;
    cloudEmployeeId: number;
    vehicleName: string;
    vehicleType: string;
    vehicleNumber: string;
    purchasedDate: string;
    dateOfRenewal: string;
    assetType: string;
    amount: string;
    updatedAt: string;
    createdAt: string;
}
export interface VehicleCreateResponse {
    success: boolean;
    data: VehicleDetails;
}
export interface VehicleUpdatePayload extends userPayload {
    cloudEmployeeId: number;
    assetName: string;
    assetCategory: string;
    serialNumber: string;
    purchasedDate: string;
    assetType: string;
    warranty: string;
    amount: string;
    vendor: string;
    batchNumber: string;
    fleetId: string;
}
export interface VehicleDeletePayload extends userPayload {
    fleetId: string;
}

export interface VehicleDocListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
    fleetId: number;
}
interface DocumentInfo {
    id: number;
    documentName: string;
    documentNumber: string;
    documentCategory: string;
    documentType: string;
    issueDate: string;
    expireDate: string;
    document: string;
    createdAt: string;
    updatedAt: string;
}
export interface VehicleDocListingResponse {
    result: DocumentInfo[];
    totalData: number;
}
export interface VehicleDocCreatePayload extends userPayload {
    cloudFleetId: string;
    documentName: string;
    documentNumber: string;
    documentType: string;
    issueDate: string;
    expireDate: string;
    documentBase: string;
    documentFormat: string;
}
interface DocumentData {
    cloudFleetId: string;
    id: number;
    documentName: string;
    documentNumber: string;
    documentType: string; // Usually an email here, consider a more appropriate name if possible.
    issueDate: string;
    expireDate: string;
    documentCategory: string; // Could be enum if there are limited set of categories.
    document: string;
    updatedAt: string;
    createdAt: string;
}
export interface VehicleDocCreateResponse {
    success: boolean;
    data: DocumentData;
}
export interface VehicleDocUpdatePayload extends userPayload {
    documentName: string;
    documentNumber: string;
    documentType: string; // Assuming this could be any string. If it has specific possible values, consider using an enum or union type.
    issueDate: string;
    expireDate: string;
    documentBase: string; // Assuming "base64" is a fixed value for this field, otherwise use string
    documentFormat: string;
    docId: number;
}
export interface VehicleDocDeletePayload extends userPayload {
    docId: string;
}
export interface VehicleUsageListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
    fleetId: number;
}
interface CloudEmployee {
    id: number;
    employeeName: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    employeeID: string;
}

interface VehicleUsage {
    id: number;
    usageCategory: string;
    assignDate: string;
    returnDate: string | null;
    returnStatus: string | null;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
    cloudEmployeeId: number;
    cloudAssetId: number;
    cloud_employee: CloudEmployee;
}
export interface VehicleUsageListingResponse {
    result: VehicleUsage[];
    totalData: number;
}
export interface VehicleUsageCreatePayload extends userPayload {
    cloudEmployeeId: number;
    fleetId: number;
    assignDate: string; // Consider using Date if handling dates as Date objects
    returnDate?: string; // Consider using Date if handling dates as Date objects
    returnStatus?: 'GOOD' | 'DAMAGED' | 'LOST' | string; // Enumerate all possible statuses if known
    remarks?: string;
    existUsageId?: number;
}

interface AssignmentDetails {
    id: number;
    cloudEmployeeId: number;
    cloudFleetId: number;
    assignDate: string;
    usageCategory: 'ASSET' | string;
    updatedAt: string;
    createdAt: string;
}
export interface VehicleUsageCreateResponse {
    success: boolean;
    data: AssignmentDetails;
}
export interface VehicleUsageUpdatePayload extends userPayload {
    cloudEmployeeId: number;
    cloudFleetId: number;
    assignDate: string; // Consider using Date if handling dates as Date objects
    returnDate: string; // Consider using Date if handling dates as Date objects
    returnStatus: string; // Can be an enumeration if there are predefined statuses
    remarks: string;
    usageId: string;
}
export interface VehicleUsageDeletePayload extends userPayload {
    usageId: string;
}

export interface VehicleMaintenanceListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
    fleetId: number;
}
interface MaintenanceRecord {
    id: number;
    maintenanceCategory: string;
    repairCategory: string;
    serviceType: string;
    date: string; // Consider using Date if handling dates as Date objects
    receivedDate: string; // Consider using Date if handling dates as Date objects
    amount: string; // If amount is always numeric, consider using number instead of string
    createdAt: string; // Consider using Date if handling dates as Date objects
    updatedAt: string; // Consider using Date if handling dates as Date objects
    cloudFleetId: number;
}
export interface VehicleMaintenanceListingResponse {
    result: MaintenanceRecord[];
    totalData: number;
}
export interface VehicleMaintenanceCreatePayload extends userPayload {
    cloudFleetId: number;
    repairCategory: string;
    serviceType: string;
    date: string; // Consider using Date if handling dates as Date objects
    receivedDate: string; // Consider using Date if handling dates as Date objects
    amount: string;
}

interface FleetMaintenanceDetail {
    id: number;
    cloudFleetId: number;
    repairCategory: string;
    serviceType: string;
    date: string; // Consider using Date if handling dates as Date objects
    receivedDate: string; // Consider using Date if handling dates as Date objects
    amount: string; // If amount is always numeric, consider using number instead of string
    maintenanceCategory: string;
    createdAt: string; // Consider using Date if handling dates as Date objects
    updatedAt: string; // Consider using Date if handling dates as Date objects
}
export interface VehicleMaintenanceCreateResponse {
    success: boolean;
    data: FleetMaintenanceDetail;
}
export interface VehicleMaintenanceUpdatePayload extends userPayload {
    repairCategory: string;
    serviceType: string;
    date: string; // Consider using Date if handling dates as Date objects
    receivedDate: string; // Consider using Date if handling dates as Date objects
    amount: string;
    maintenanceId: string;
}
export interface VehicleMaintenanceDeletePayload extends userPayload {
    maintenanceId: string;
}

export interface SingleVehicleDetailsPayload extends userPayload {
    fleetId: string;
}
export interface SingleVehicleDetailsResponse {
    success: boolean;
    data: {
        id: number;
        vehicleName: string;
        vehicleType: string;
        vehicleNumber: string;
        purchasedDate: string;
        assetType: string;
        dateOfRenewal: string;
        amount: string;
        amountRecurring: string | null;
        vendor: string | null;
        modelYear: string | null;
        chassisNumber: string | null;
        engineTransmission: string | null;
        odoMeter: string | null;
        createdAt: string;
        updatedAt: string;
        cloudEmployeeId: number | null;
        credentialId: number;
        status: string;
    };
}

export interface LatestVehicleDetailsResponse {
    id: number;
    usageCategory: string;
    assignDate: string;
    returnDate: string | null;
    returnStatus: string | null;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
    cloudEmployeeId: number;
    cloudAssetId: number | null;
    cloudFleetId: number | null;
    cloud_employee: CloudEmployee;
}
