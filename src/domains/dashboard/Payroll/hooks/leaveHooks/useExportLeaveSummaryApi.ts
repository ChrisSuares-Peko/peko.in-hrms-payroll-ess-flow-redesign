import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { ExportLeaveData } from '../../api/leaveApis';
import { exportLeaveDataResponse } from '../../types/leaveSection';
// import { exportLeaveDataResponse } from '../../types/leaveSection';

export default function useExportLeaveSummaryApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getLeaveSummary = useCallback(
        async (month: number | string, year: number | string, searchText: string) => {
            setIsLoading(true);
            const data: exportLeaveDataResponse | false = await ExportLeaveData({
                userId: id,
                userType: role,
                month,
                year,
                searchText,
            });
            if (data) {
                const salaryData = data as exportLeaveDataResponse;
                const arrayBuffer = new Uint8Array(salaryData.buffer.data);
                const monthNames = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ];
                const formattedMonth = typeof month === 'number' ? monthNames[month - 1] : month;
                const fileName = `Leave_Summary_${formattedMonth}_${year}.xlsx`;
                // Convert ArrayBuffer to Blob
                const blob = new Blob([arrayBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                // Trigger download
                saveAs(blob, fileName);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    return { loader: isLoading, getLeaveSummary };
}
