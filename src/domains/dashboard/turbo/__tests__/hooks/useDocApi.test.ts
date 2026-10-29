import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getAllDocs, createDocument, deleteDocument } from '../../api/index';
import useDocApi from '../../hooks/useDocApi';

vi.mock('../../api/index', () => ({
  getAllDocs: vi.fn(),
  createDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: {
          id: 'USER123',
          role: 'admin',
        },
      },
    }),
}));

describe('useDocApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultParams = {
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

  it('should fetch and set documents on getDocs success', async () => {
    (getAllDocs as any).mockResolvedValue({
      data: [{ id: 1, name: 'Document A' }],
      recordsTotal: 5,
    });

    const { result } = renderHook(() => useDocApi(defaultParams));

    await act(async () => {});

    expect(getAllDocs).toHaveBeenCalledWith({
      userId: 'USER123',
      userType: 'admin',
      from: '',
      to: '',
      searchText: '',
      page: 1,
      itemsPerPage: 10,
    });

    expect(result.current.doc).toEqual([{ id: 1, name: 'Document A' }]);
    expect(result.current.count).toBe(5);
  });

  it('createDoc should return data and set refresh true when success', async () => {
    const mockResponse = { success: true, data: { id: 10 } };
    (createDocument as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDocApi(defaultParams));

    let response;
    await act(async () => {
      response = await result.current.createDoc({ title: 'Test Doc' });
    });

    expect(createDocument).toHaveBeenCalled();
    expect(response).toEqual(mockResponse);
  });

  it('createDoc should return false when api returns false', async () => {
    (createDocument as any).mockResolvedValue(false);

    const { result } = renderHook(() => useDocApi(defaultParams));

    let response;
    await act(async () => {
      response = await result.current.createDoc({ title: 'Test Doc' });
    });

    expect(response).toBe(false);
  });

  it('deteteDoc should return true when successful', async () => {
    (deleteDocument as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDocApi(defaultParams));

    let response;
    await act(async () => {
      response = await result.current.deteteDoc(12);
    });

    expect(deleteDocument).toHaveBeenCalledWith({
      userId: 'USER123',
      userType: 'admin',
      docId: 12,
    });

    expect(response).toBe(true);
  });

  it('deteteDoc should return false when failed', async () => {
    (deleteDocument as any).mockResolvedValue(false);

    const { result } = renderHook(() => useDocApi(defaultParams));

    let response;
    await act(async () => {
      response = await result.current.deteteDoc(12);
    });

    expect(response).toBe(false);
  });
});
