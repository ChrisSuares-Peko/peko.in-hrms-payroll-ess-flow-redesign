import React, { useState } from 'react';

import { Dropdown, MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import MoreServicesIcon from '@src/assets/svg/more.svg';

type ViewMoreProps = {
    list: {
        label: string;
        path?: string;
        action?: () => void;
        id?: string | number;
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
                    <Link to={item.path} key={`nav-${index}`}>
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
                        tabIndex={0}
                        role="button"
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
                className="flex justify-center w-4 cursor-pointer item"
            >
                <ReactSVG src={MoreServicesIcon} />
            </div>
        </Dropdown>
    );
};

export default ViewMore;
