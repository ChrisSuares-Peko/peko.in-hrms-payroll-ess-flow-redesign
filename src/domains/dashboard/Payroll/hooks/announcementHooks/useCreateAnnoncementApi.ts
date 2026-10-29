import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createAnnouncementAPI } from '../../api/announcementApi/index';
import { IAnnouncementPostData, IEmployeeList } from '../../types/announcementTypes';

export default function CreateAnnouncement() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const createAnnouncementHandler = async (postData: IAnnouncementPostData) => {
        const data: SuccessGenericResponse<IEmployeeList> | false = await createAnnouncementAPI({
            userId: id,
            userType: role,
            postData,
        });

        if (data) {
            return true;
        }
        return false;
    };

    return { createAnnouncementHandler };
}
