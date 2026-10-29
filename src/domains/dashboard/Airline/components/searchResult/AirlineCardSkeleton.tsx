import { Fragment } from 'react';

export default function AirlineCardSkeleton({ length = 1 }: { length?: number }) {
    return Array.from({ length }).map((_, index) => (
        <Fragment key={index}>
            {/* web--------------------- */}
            <div className="w-full hidden md:block my-2">
                {/* Skeleton card */}
                <div className="w-full bg-white p-6 border-b border-gray-100 animate-pulse">
                    <div className="flex flex-row w-full">
                        {/* Airline logo and info */}
                        <div className="w-1/5 ">
                            <div className="w-32 h-28 rounded bg-gray-200" />
                        </div>

                        {/* Departure info */}
                        <div className="w-1/5 flex flex-col justify-center">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
                            <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>

                        {/* Duration */}
                        <div className="w-1/5 flex flex-col items-center justify-center   ">
                            <div className="flex items-center w-full mt-4">
                                <div className="h-1 bg-gray-200 flex-grow" />
                                <div className="w-2 h-2 rounded-full bg-gray-200 mx-1" />
                                <div className="h-1 bg-gray-200 flex-grow" />
                            </div>
                            <div className="h-4 w-16 bg-gray-200 rounded mt-2" />
                            <div className="h-3 w-16 bg-gray-200 rounded mt-2" />
                        </div>

                        {/* Arrival info */}
                        <div className="w-1/5 flex flex-col items-end justify-center">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
                            <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>

                        {/* Price and button */}
                        <div className="w-1/5 flex flex-col items-end justify-center">
                            <div className="h-3 w-12 bg-gray-200 rounded mb-1" />
                            <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                            <div className="h-10 w-28 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
            </div>
            {/* mob----------------------------- */}
            <div className="md:hidden w-full rounded-2xl my-2 border border-gray-200 p-5 animate-pulse">
                {/* Airline header */}
                <div className="flex items-center mb-6">
                    <div className="w-10 h-8 bg-gray-200 rounded mr-3" />
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                </div>

                {/* Flight times and details */}
                <div className="flex justify-between mb-6">
                    {/* Departure */}
                    <div className="flex flex-col">
                        <div className="h-8 w-20 bg-gray-200 rounded-lg mb-2" />
                        <div className="flex items-center">
                            <div className="h-4 w-12 bg-gray-200 rounded mr-2" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col items-center">
                        <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>

                    {/* Arrival */}
                    <div className="flex flex-col items-end">
                        <div className="h-8 w-20 bg-gray-200 rounded-lg mb-2" />
                        <div className="flex items-center">
                            <div className="h-4 w-12 bg-gray-200 rounded mr-2" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
                {/* Price section */}
                <div className="flex justify-between items-center mb-4">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="flex flex-col items-end">
                        <div className="h-6 w-28 bg-gray-200 rounded mb-1" />
                        <div className="h-4 w-44 bg-gray-200 rounded" />
                    </div>
                </div>

                {/* Book now button */}
                <div className="w-full h-12 bg-gray-200 rounded-lg mb-4" />

                {/* Flight details link */}
                <div className="flex justify-center items-center">
                    <div className="h-4 w-24 bg-gray-200 rounded mr-1" />
                    <div className="w-4 h-4 bg-gray-200 rounded-full" />
                </div>
            </div>
        </Fragment>
    ));
}
