import React, { useEffect, useState } from 'react';

import { Flex, TreeSelect, Typography } from 'antd';
import type { TreeSelectProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { getPathFromLabel } from '@src/domains/admin/utils/helperFunctions';
import { store, RootState } from '@store/store';

import searchIcon from '../../../assets/icons/searchIcon.svg';

const SearchTree: React.FC = () => {
    const [value, setValue] = useState<string | undefined>();
    const { services } = (store.getState() as RootState).reducer.services;
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const newSearchvalue = localStorage.getItem('searchValue');
    const serviceCategory = pathname
        ?.toLocaleLowerCase()
        ?.split('/')[2]
        ?.split('-')
        ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
        ?.join(' ');
    const subService =
        pathname
            ?.toLocaleLowerCase()
            ?.split('/')[3]
            ?.split('-')
            ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
            ?.join(' ') || '';
    const onChange = (newValue: string) => {
        setValue(newValue);
        localStorage.setItem('searchValue', newValue);
        if (newValue) {
            navigate(`/system-user/${newValue}`);
        }
    };
    const onPopupScroll: TreeSelectProps['onPopupScroll'] = e => {
        console.log('onPopupScroll', e);
    };
    useEffect(() => {
        if (newSearchvalue) {
            setValue(newSearchvalue);
        }
    }, [newSearchvalue]);
    useEffect(() => {
        if (
            serviceCategory?.toLowerCase() ===
            value
                ?.split('/')[0]
                ?.split('-')
                ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
                ?.join(' ')
                ?.toLowerCase()
        ) {
            if (
                subService &&
                subService.toLowerCase() !==
                    value
                        ?.split('/')[1]
                        ?.split('-')
                        ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        ?.join(' ')
                        ?.toLowerCase()
            ) {
                setValue(undefined);
                localStorage.removeItem('searchValue');
            }
        } else {
            setValue(undefined);
            localStorage.removeItem('searchValue');
        }
    }, [serviceCategory, subService, value]);
    // Nodes without a name are skipped — they'd produce a broken route that crashes RoleGuard.
    const treeData =
        services?.data
            ?.filter(service => service?.hasAccess && service?.serviceCategory)
            ?.map(service => ({
                value: getPathFromLabel(service.serviceCategory),
                title: service.serviceCategory,
                children: (service?.services ?? [])
                    .filter(item => item?.hasAccess && item?.category)
                    .map(item => ({
                        value: `${getPathFromLabel(service.serviceCategory)}?category=${getPathFromLabel(item.category || '')}`,
                        title: item.category,
                        children: (item?.services ?? [])
                            .filter(subservice => subservice?.hasAccess && subservice?.service)
                            .map(subservice => ({
                                value: `${getPathFromLabel(service.serviceCategory)}/${getPathFromLabel(subservice.service)}`,
                                title: subservice.service,
                            })),
                    })),
            })) || [];

    return (
        <Flex align="center" justify="space-between" className="w-full self-center">
            <TreeSelect
                showSearch
                style={{ width: '100%' }}
                value={value}
                styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
                placeholder="Search for services"
                allowClear
                onClear={() => localStorage.removeItem('searchValue')}
                treeDefaultExpandAll={false}
                onChange={onChange}
                treeData={treeData}
                onPopupScroll={onPopupScroll}
                className="rounded-2xl"
                variant="borderless"
                suffixIcon={
                    <ReactSVG
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width: 18px; height: 18px;');
                        }}
                        src={searchIcon}
                        className="text-base text-center"
                    />
                }
                notFoundContent={<Typography.Text>Service not found</Typography.Text>}
                filterTreeNode={(input, treeNode) => {
                    const normalize = (str: string) => str.toLowerCase().replace(/-/g, ' ').trim();
                    return normalize(String(treeNode.title ?? '')).includes(normalize(input));
                }}
            />
        </Flex>
    );
};

export default SearchTree;
