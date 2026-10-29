import DirectorBlock from './DirectorBlock';
import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';

type Props = {
    section: ISection;
    // Full path to this instance: `pages.{pageId}.{sectionId}.{index}`.
    instancePath: string;
    index: number;
    name: string;
    nationality: string;
    indianNationalityValue: string;
    personLabel: string;
};

// Binds one repeater instance's flat fields to a DirectorBlock for the inline
// view. The instance's document fields are unnumbered ('director_*'), so
// DirectorBlock is rendered with fieldPrefix="director".
export default function DirectorInstanceBlock({ section, instancePath, index, ...person }: Props) {
    const { get, set, error } = useCustomSectionFields(section, instancePath);

    return (
        <DirectorBlock
            error={error}
            fieldPrefix="director"
            get={get}
            index={index}
            set={set}
            {...person}
        />
    );
}
