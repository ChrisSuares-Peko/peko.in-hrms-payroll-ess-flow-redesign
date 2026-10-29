import { Content } from 'antd/es/layout/layout';

const HotelListSkeleton = ({ length = 1 }: { length?: number }) =>
    Array.from({ length }).map((_, index) => (
        <Content className="md:px-7 mb-4" key={index}>
            <div className="bg-white rounded-md p-4 w-full flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="w-full md:w-1/4 h-40 bg-gray-200 rounded-md flex items-center justify-center animate-pulse">
                    <svg
                        className="w-12 h-12 text-gray-300"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="h-6 bg-gray-200 w-1/2 rounded-md animate-pulse" />
                        <div className="h-4 bg-gray-200 w-full max-w-md rounded-md animate-pulse mt-2" />
                        <div className="h-4 bg-gray-200 w-2/3 max-w-sm rounded-md animate-pulse mt-1" />
                    </div>
                    <div className="mt-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end justify-between md:w-48 gap-2">
                    <div className="flex flex-col items-end">
                        <div className="h-6 bg-gray-200 w-32 rounded-md animate-pulse" />
                        <div className="h-4 bg-gray-200 w-40 rounded-md animate-pulse mt-2" />
                    </div>
                    <div className="h-10 bg-gray-200 w-36 rounded-md animate-pulse mt-auto" />
                </div>
            </div>
        </Content>
    ));

export default HotelListSkeleton;
