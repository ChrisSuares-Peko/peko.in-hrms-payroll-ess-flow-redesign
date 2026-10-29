import { BsCameraVideo, BsLightningChargeFill, BsTelephone } from 'react-icons/bs';
import { MdOutlineAir, MdOutlineBed, MdOutlineChair, MdOutlineFastfood, MdOutlineLightbulb, MdOutlineLocalDrink, MdOutlineRestaurant, MdOutlineSecurity, MdOutlineTv, MdOutlineWc } from 'react-icons/md';
import { RiMovieLine, RiWifiFill } from 'react-icons/ri';

export const AMENITY_ICONS: Record<string, React.ReactNode> = {
    'wifi':                     <RiWifiFill size={13} />,
    'wi-fi':                    <RiWifiFill size={13} />,
    'water bottle':             <MdOutlineLocalDrink size={13} />,
    'charging point':           <BsLightningChargeFill size={12} />,
    'blankets':                 <MdOutlineBed size={13} />,
    'blanket':                  <MdOutlineBed size={13} />,
    'pillow':                   <MdOutlineBed size={13} />,
    'reading light':            <MdOutlineLightbulb size={13} />,
    'waiting lounge':           <MdOutlineChair size={13} />,
    'movie':                    <RiMovieLine size={13} />,
    'cctv':                     <MdOutlineSecurity size={13} />,
    'emergency contact number': <BsTelephone size={12} />,
    'emergency contact':        <BsTelephone size={12} />,
    'cctv camera':              <BsCameraVideo size={12} />,
    'bedsheet':                 <MdOutlineBed size={13} />,
    'toilet':                   <MdOutlineWc size={13} />,
    'washroom':                 <MdOutlineWc size={13} />,
    'restroom':                 <MdOutlineWc size={13} />,
    'air purifier':             <MdOutlineAir size={13} />,
    'free meal':                <MdOutlineRestaurant size={13} />,
    'personal tv':              <MdOutlineTv size={13} />,
    'snacks':                   <MdOutlineFastfood size={13} />,
};
