import React, { useState } from 'react';

import Icon from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import MoreServicesIcon from '@domains/dashboard/Payroll/assets/icons/viewMore.svg';

type ViewMoreProps = {
    list: {
        label: string;
        path?: string;
        action?: () => void;
        id?: string;
    }[];
};

const ViewMore: React.FC<ViewMoreProps> = ({ list }) => {
    const items: MenuProps['items'] = [];
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    list.forEach((item, index) => {
        if (item.path) {
            items.push({
                key: `nav-${index}`,
                label: (
                    <Link
                        to={item.path}
                        key={`nav-${index}`}
                        state={{
                            employeeId: item.id,
                        }}
                    >
                        {item.label}
                    </Link>
                ),
            });
        } else if (item.action) {
            items.push({
                key: `action-${index}`,
                label: (
                    <div
                        onClick={e => {
                            e.preventDefault();
                            if (item.action) {
                                item.action();
                            }
                        }}
                        onKeyDown={e => {
                            if ((e.key === 'Enter' || e.key === ' ') && item.action) {
                                e.preventDefault();
                                item.action();
                            }
                        }}
                        tabIndex={0} // Making it keyboard accessible
                        role="button" // Semantic role for the div
                        style={{ cursor: 'pointer' }}
                        key={`action-${index}`}
                    >
                        {item.label}
                    </div>
                ),
            });
        }
    });

    return (
        <Dropdown
            menu={{ items }}
            placement="bottom"
            open={dropdownVisible}
            onOpenChange={setDropdownVisible}
            trigger={['click']}
            arrow
        >
            <div
                onClick={toggleDropdown}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') toggleDropdown();
                }}
                tabIndex={0}
                role="button"
                aria-haspopup="true"
                aria-expanded={dropdownVisible}
                className="svg-primary-stroke cursor-pointer"
            >
                <Icon
                    component={() => <ReactSVG src={MoreServicesIcon} />}
                    className="svg-primary-stroke"
                />
            </div>
        </Dropdown>
    );
};

export default ViewMore;
