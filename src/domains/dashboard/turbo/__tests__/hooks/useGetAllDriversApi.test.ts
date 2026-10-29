import { renderHook, act } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getAllDrivers, deleteDriver, getFileBufferDriverReport } from '../../api/index';
import useGetAllDriversApi from '../../hooks/useGetAllDrivers';

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: {
          role: 'admin',
          id: '123',
        },
      },
    }),
}));

vi.mock('../../api/index', () => ({
  getAllDrivers: vi.fn(),
  deleteDriver: vi.fn(),
  getFileBufferDriverReport: vi.fn(),
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));


describe('useGetAllDriversApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    searchText: '',
    category: '',
    sort: '',
    page: 1,
    itemsPerPage: 10,
    filter: '',
    from: '',
    to: '',
    sortField: '',
  };

  it('should fetch and map drivers correctly', async () => {
    (getAllDrivers as any).mockResolvedValue({
      data: [
        { id: 'D1', dlNumber: 'DL123', name: 'John Doe' },
        { id: 'D2', dlNumber: 'DL456', name: 'Jane Doe' },
      ],
      recordsTotal: 2,
    });

    const { result } = renderHook(() => useGetAllDriversApi(defaultProps));

    await act(async () => {});

    expect(getAllDrivers).toHaveBeenCalled();
    expect(result.current.drivers).toEqual([
      { driverId: 'D1', dlNumber: 'DL123', name: 'John Doe' },
      { driverId: 'D2', dlNumber: 'DL456', name: 'Jane Doe' },
    ]);
    expect(result.current.count).toBe(2);
  });

  it('should call deleteDriverApi and trigger refresh', async () => {
    (deleteDriver as any).mockResolvedValue(true);

    const { result } = renderHook(() => useGetAllDriversApi(defaultProps));

    await act(async () => {
      const res = await result.current.deleteDriverApi({ id: 'D1' });
      expect(res).toBe(true);
    });

    expect(deleteDriver).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      id: 'D1',
    });
  });

  it('should download report file', async () => {
    (getFileBufferDriverReport as any).mockResolvedValue({
      buffer: { data: new Uint8Array([1, 2, 3]) },
      fileType: 'application/pdf',
    });

    const { result } = renderHook(() => useGetAllDriversApi(defaultProps));

    await act(async () => {
      await result.current.downloadReport('pdf');
    });

    expect(getFileBufferDriverReport).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      type: 'pdf',
      from: '',
      to: '',
      searchText: '',
      page: 1,
      itemsPerPage: 10,
    });
    expect(saveAs).toHaveBeenCalled();
  });
});
