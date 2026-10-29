import { Flex } from 'antd';

import AllIcon from '../assets/icons/allIcon.svg';
import BagsIcon from '../assets/icons/bags.svg';
import FlightIcon from '../assets/icons/flight.svg';
import GameIcon from '../assets/icons/game.svg';
import GroceriesIcon from '../assets/icons/groceries.svg';
import LaptopIcon from '../assets/icons/laptop.svg';
import OtherIcon from '../assets/icons/other.svg';
import PopcornIcon from '../assets/icons/popcorns.svg';
import RingIcon from '../assets/icons/ring.svg';
import SportIcon from '../assets/icons/sport.svg';
import { giftCardCategories } from '../utils/data';

const categoryIcons: Record<string, string> = {
    all: AllIcon,
    fashion: BagsIcon,
    food: PopcornIcon,
    travel: FlightIcon,
    electronics: LaptopIcon,
    grocery: GroceriesIcon,
    sports: SportIcon,
    jewellery: RingIcon,
    gaming: GameIcon,
    others: OtherIcon,
};

interface CategoryFilterProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => (
    // Wraps onto multiple rows from sm up, same as before; below that there isn't
    // enough width for all the category pills, so they scroll horizontally in a
    // single row instead (hide-scrollbar keeps it a clean swipe, no visible bar).
    <Flex
        gap={8}
        className="mt-7 py-1 flex-nowrap overflow-x-auto hide-scrollbar sm:flex-wrap sm:overflow-visible"
    >
        {giftCardCategories.map(({ key, label }) => {
            const isSelected = selectedCategory === key;
            return (
                <button
                    key={key}
                    type="button"
                    onClick={() => onCategoryChange(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full cursor-pointer transition-all shrink-0 ${
                        isSelected
                            ? 'bg-brandSurface border border-brandPrimary text-brandSecondary'
                            : 'bg-brandSurface border border-transparent text-textBlack'
                    }`}
                    style={{ fontWeight: isSelected ? 500 : 400 }}
                >
                    <img src={categoryIcons[key]} alt={label} className="w-5 h-5 object-contain" />
                    <span className="whitespace-nowrap" style={{ fontSize: 13 }}>{label}</span>
                </button>
            );
        })}
    </Flex>
);

export default CategoryFilter;
