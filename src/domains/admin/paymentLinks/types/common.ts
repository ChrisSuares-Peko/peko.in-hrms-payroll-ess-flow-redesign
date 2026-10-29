import { CorporateUser } from '../../settings/types/disabledTypes';

export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
};

export type CorporateListResponse = {
    result: CorporateUser[];
};

export type ServiceProvider = {
    id: number;
    serviceProvider: string;
};

export type ServiceProviderData = {
    data: ServiceProvider[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
