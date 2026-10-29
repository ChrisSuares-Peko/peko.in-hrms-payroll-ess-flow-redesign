/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import * as React from 'react';
import { useCallback, useEffect, useState, DragEvent } from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Flex, Spin, Typography } from 'antd';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import '../../assets/styles.css';
import { showToast } from '@src/slices/apiSlice';

import SignersPopup from './SignersPopup';
import {
    setESignDocData,
    addSignerCoordinate,
    removeSignerObject,
    updateSignerCoordinate,
} from '../../slices/eSignDocSlice';

const workerUrl = `/javascript/pdf.worker.min.js`;

interface ThumbnailExampleProps {
    setError: React.Dispatch<React.SetStateAction<boolean>>;
}
// Set worker URL for PDF.js
GlobalWorkerOptions.workerSrc = workerUrl;

const ThumbnailExample: React.FC<ThumbnailExampleProps> = ({ setError }) => {
    const dispatch = useAppDispatch();
    const { documentBase64 } = useAppSelector(state => state.reducer.eSignDoc);

    const signers = useAppSelector(state => state.reducer.eSignDoc.signerCo);
    const [pages, setPages] = useState<string[]>([]);
    const { signers_info, isDisabled } = useAppSelector(state => state.reducer.eSignDoc);
    const [openSignersPopup, setOpenSignersPopup] = useState(false);
    const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
    const [draggingPos, setDraggingPos] = useState<{ x: number; y: number; page: number } | null>(
        null
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [tappedCoordinates, setTappedCoordinates] = useState<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        page: number;
        pageHeight: number;
        pageWidth: number;
    } | null>(null);
    const loadPdf = useCallback(
        async (base64: string) => {
            try {
                setLoading(true);
                const pdfData = atob(base64.split(',')[1]);
                const pdf = await getDocument({ data: pdfData }).promise;
                const { numPages } = pdf;
                dispatch(setESignDocData({ pageNumbers: numPages }));

                const renderedPages: string[] = [];
                const dimensions: { width: number; height: number }[] = [];
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    // Get actual page dimensions in points (1/72 inch)
                    const viewport = page.getViewport({ scale: 1.0 });
                    dimensions.push({ width: viewport.width, height: viewport.height });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height * 1.5;
                    canvas.width = viewport.width * 1.5;

                    const renderViewport = page.getViewport({ scale: 1.5 });
                    await page.render({ canvasContext: context!, viewport: renderViewport })
                        .promise;
                    renderedPages.push(canvas.toDataURL('image/png'));
                }
                setPages(renderedPages);

                setPageDimensions(dimensions);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                setError(true);
                setLoading(false);
            }
        },
        [dispatch, setPages, setError]
    );

    useEffect(() => {
        if (documentBase64) {
            loadPdf(documentBase64);
        }
    }, [documentBase64, loadPdf]);

    const handleDrop = (e: DragEvent<HTMLDivElement>, pageIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        const signerData = e.dataTransfer.getData('signer');
        const signer = JSON.parse(signerData);

        const boundingRect = e.currentTarget.getBoundingClientRect();
        const offsetX = Math.floor(e.clientX - boundingRect.left + e.currentTarget.scrollLeft);
        const offsetY = Math.floor(e.clientY - boundingRect.top + e.currentTarget.scrollTop);
        const { width: pageWidth, height: pageHeight } = pageDimensions[pageIndex - 1];
        const actualWidth = e.currentTarget.offsetWidth;
        const actualHeight = e.currentTarget.offsetHeight;
        const width = 110; // Rectangle width
        const height = 40; // Rectangle height

        let x1 = offsetX; // Top-left X
        let y1 = offsetY; // Top-left Y
        let x2 = x1 + width; // Bottom-right X
        let y2 = y1 + height; // Bottom-right Y

        // Adjust coordinates to stay within the page boundaries
        if (x2 > actualWidth) {
            x1 = actualWidth - width;
            x2 = actualWidth;
        }
        if (y2 > actualHeight) {
            y1 = actualHeight - height;
            y2 = actualHeight;
        }

        // Ensure x1 and y1 are non-negative
        x1 = Math.max(0, x1);
        y1 = Math.max(0, y1);

        // Collect existing signers from the currently rendered ones
        const existingSigners = Object.entries(signers).flatMap(([key, signerArray]) =>
            signerArray
                .filter(pos => pos.page === pageIndex) // Only consider signers on the current page
                .map(pos => ({ ...pos, key }))
        );

        // Check for overlap, excluding the currently dragged signer
        const isOverlapping = existingSigners.some(existingSigner => {
            if (existingSigner.id === signer.id && existingSigner.key === signer.key) {
                // Allow overlap with itself
                return false;
            }
            const overlapX = Math.max(existingSigner.x1, x1) < Math.min(existingSigner.x2, x2);
            const overlapY = Math.max(existingSigner.y1, y1) < Math.min(existingSigner.y2, y2);
            return overlapX && overlapY;
        });

        if (isOverlapping) {
            dispatch(
                showToast({
                    description:
                        'Cannot drop here. This position has already been assigned for signing.',
                    variant: 'error',
                })
            );
            setDraggingPos(null);
            return;
        }

        if (signer?.id) {
            dispatch(
                updateSignerCoordinate({
                    key: signer.key,
                    id: signer.id,
                    updatedCoordinate: {
                        x1,
                        x2,
                        y1,
                        y2,
                        page: pageIndex,
                        pageHeight,
                        pageWidth,
                    },
                })
            );
        } else {
            const uniqueId = uuidv4();

            dispatch(
                addSignerCoordinate({
                    key: signer?.signer_index,
                    data: {
                        id: uniqueId,
                        x1,
                        x2,
                        y1,
                        y2,
                        page: pageIndex,
                        pageHeight,
                        pageWidth,
                    },
                })
            );
        }

        setDraggingPos(null);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>, pageIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        const boundingRect = e.currentTarget.getBoundingClientRect();
        const offsetX = Math.floor(e.clientX - boundingRect.left + e.currentTarget.scrollLeft);
        const offsetY = Math.floor(e.clientY - boundingRect.top + e.currentTarget.scrollTop);

        if (
            offsetX >= 0 &&
            offsetY >= 0 &&
            offsetX <= boundingRect.width &&
            offsetY <= boundingRect.height
        ) {
            setDraggingPos({ x: offsetX, y: offsetY, page: pageIndex });
        } else {
            setDraggingPos(null);
        }
    };

    const handleDragLeave = () => {
        setDraggingPos(null);
    };

    const handleDragEnd = () => {
        setDraggingPos(null);
    };

    const handleRemoveSigner = (key: number, id: string) => {
        dispatch(removeSignerObject({ key, id }));
    };

    const handleDoubleTap = (e: React.TouchEvent<HTMLDivElement>, pageIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDisabled) {
            return;
        }
        // Store the timestamp of the last tap
        const currentTime = new Date().getTime();
        const timeSinceLastTap = currentTime - lastTapTime;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // If the second tap occurs within 300ms, it’s a double-tap
            const touch = e.changedTouches[0];
            const boundingRect = e.currentTarget.getBoundingClientRect();
            const offsetX = Math.floor(
                touch.clientX - boundingRect.left + e.currentTarget.scrollLeft
            );
            const offsetY = Math.floor(
                touch.clientY - boundingRect.top + e.currentTarget.scrollTop
            );

            const { width: pageWidth, height: pageHeight } = pageDimensions[pageIndex - 1];

            const width = 110; // Rectangle width
            const height = 40; // Rectangle height

            // Calculate coordinates
            let x1 = offsetX - width / 2; // Top-left X
            let y1 = offsetY - height / 2; // Top-left Y
            let x2 = x1 + width; // Bottom-right X
            let y2 = y1 + height; // Bottom-right Y

            // Adjust coordinates to stay within the page boundaries
            if (x1 < 0) {
                x1 = 0;
                x2 = x1 + width;
            }
            if (y1 < 0) {
                y1 = 0;
                y2 = y1 + height;
            }
            if (x2 > pageWidth) {
                x2 = pageWidth;
                x1 = x2 - width;
            }
            if (y2 > pageHeight) {
                y2 = pageHeight;
                y1 = y2 - height;
            }

            // Collect existing signers from the currently rendered ones
            const existingSigners = Object.entries(signers).flatMap(([key, signerArray]) =>
                signerArray
                    .filter(pos => pos.page === pageIndex) // Only consider signers on the current page
                    .map(pos => ({ ...pos, key }))
            );

            // Check for overlap, excluding the currently dragged signer
            const isOverlapping = existingSigners.some(existingSigner => {
                const overlapX = Math.max(existingSigner.x1, x1) < Math.min(existingSigner.x2, x2);
                const overlapY = Math.max(existingSigner.y1, y1) < Math.min(existingSigner.y2, y2);
                return overlapX && overlapY;
            });

            if (isOverlapping) {
                dispatch(
                    showToast({
                        description:
                            'Cannot place a signer here. This position is already assigned for signing.',
                        variant: 'error',
                    })
                );
                return; // Exit if overlapping
            }

            // If not overlapping, set the coordinates and open the modal
            setTappedCoordinates({
                x1,
                y1,
                x2,
                y2,
                page: pageIndex,
                pageHeight,
                pageWidth,
            });

            setOpenSignersPopup(true); // Open modal
        }

        lastTapTime = currentTime; // Update the timestamp of the last tap
    };

    let lastTapTime = 0; // Variable to store the timestamp of the last tap
    const handleDragStart = (
        e: DragEvent<HTMLDivElement>,
        key: string,
        id: string,
        currentPos: { x1: number; y1: number; page: number }
    ) => {
        e.stopPropagation();
        e.dataTransfer.setData('signer', JSON.stringify({ key, id }));
    };
    const allSigned = signers_info.every(signer => signer.status === 'signed');
    return (
        <Flex
            className="thumbnail-example-container border rounded-r-md sm:rounded-none relative"
            style={{
                overflowY: 'auto',
                maxHeight: '600px',
                backgroundColor: '#F9FAFC',
                padding: '0 0',
            }}
        >
            <DndProvider backend={HTML5Backend}>
                <Flex className="w-full justify-center bg-[#F9FAFC] min-h-[50rem]">
                    <Flex vertical className="w-full  rpv-core__viewer">
                        {loading && (
                            <Flex
                                justify="center"
                                align="center"
                                className="absolute inset-0 bg-white bg-opacity-75"
                            >
                                <Spin tip="Uploading..." />
                            </Flex>
                        )}
                        {pages.map((page, index) => {
                            const { width, height } = pageDimensions[index];
                            return (
                                <div
                                    key={index}
                                    className="relative mb-4"
                                    onDrop={e => handleDrop(e, index + 1)}
                                    onDragOver={e => handleDragOver(e, index + 1)}
                                    onDragLeave={handleDragLeave}
                                    onDragEnd={handleDragEnd}
                                    onTouchEnd={e => handleDoubleTap(e, index + 1)}
                                    style={{
                                        width: `${width}px`, // Keep original page width
                                        height: `${height}px`, // Keep original page height
                                        position: 'relative',

                                        margin: '0 auto 20px auto', // Add 20px vertical gap between pages
                                    }}
                                >
                                    <img
                                        src={page}
                                        alt={`Page ${index + 1}`}
                                        style={{ width: '100%', height: '100%' }}
                                    />

                                    {/* Show the dragging placeholder */}
                                    {draggingPos && draggingPos.page === index + 1 && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: `${draggingPos.y}px`,
                                                left: `${draggingPos.x}px`,
                                                width: '110px',
                                                height: '40px',
                                                backgroundColor: '#D9EECC',
                                                border: '2px #05BE63',
                                                borderRadius: '4px',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}

                                    {isDisabled &&
                                        signers_info
                                            .filter(signer =>
                                                allSigned ? signer.status !== 'signed' : true
                                            )
                                            .flatMap((signer, signerIndex) =>
                                                signer.signer_position
                                                    .filter(position => position.page === index + 1)
                                                    .map(position => ({
                                                        ...position,
                                                        signer_name: signer.signer_name,
                                                        signer_number: signerIndex + 1,
                                                    }))
                                            )
                                            .map((pos, posIndex) => (
                                                <div
                                                    key={`disabled-sign-${posIndex}`}
                                                    style={{
                                                        position: 'absolute',
                                                        top: `${pos.y1}px`,
                                                        left: `${pos.x1}px`,
                                                        backgroundColor: '#D9EECC',
                                                        padding: '4px 0px',
                                                        justifyContent: 'center',
                                                        borderRadius: '0px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        borderWidth: '2px',
                                                        borderStyle: 'solid',
                                                        borderColor: '#05BE63',
                                                        width: '110px',
                                                    }}
                                                >
                                                    <Typography.Text className="font-normal text-[.7rem] text-center line-clamp-1">
                                                        {pos.signer_name}
                                                    </Typography.Text>
                                                    <Typography.Text className="font-normal text-[.6rem] text-[#8E8E8E] text-center">
                                                        {`Signer ${pos.signer_number}`}
                                                    </Typography.Text>
                                                </div>
                                            ))}

                                    {Object.entries(signers).map(([key, signerArray]) =>
                                        signerArray
                                            .filter(pos => pos.page === index + 1)
                                            .map((pos, posIndex) => (
                                                <div
                                                    key={`${key}-${posIndex}`}
                                                    draggable
                                                    onDragStart={e => {
                                                        // Custom drag image logic here
                                                        const dragImage =
                                                            document.createElement('div');
                                                        dragImage.style.width = '110px';
                                                        dragImage.style.height = '40px';
                                                        dragImage.style.backgroundColor =
                                                            'transparent';
                                                        dragImage.style.position = 'absolute';
                                                        dragImage.style.top = '-9999px';
                                                        dragImage.style.pointerEvents = 'none';

                                                        document.body.appendChild(dragImage);
                                                        e.dataTransfer.setDragImage(
                                                            dragImage,
                                                            0,
                                                            0
                                                        );

                                                        handleDragStart(e, key, pos.id, pos);

                                                        setTimeout(() => {
                                                            document.body.removeChild(dragImage);
                                                        }, 0);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: `${pos.y1}px`,
                                                        left: `${pos.x1}px`,
                                                        backgroundColor: '#D9EECC',
                                                        // padding: '8px 16px',
                                                        justifyContent: 'center',
                                                        borderRadius: '0px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        borderWidth: '2px',
                                                        borderStyle: 'solid',
                                                        borderColor: '#05BE63',
                                                        width: '110px',
                                                        height: '40px',
                                                        cursor: 'grab',
                                                    }}
                                                >
                                                    {`Signer ${Number(key) + 1}`}
                                                    <CloseCircleOutlined
                                                        style={{
                                                            fontSize: '16px',
                                                            color: '#ff4d4f',
                                                            marginLeft: '8px',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() =>
                                                            handleRemoveSigner(Number(key), pos.id)
                                                        } // For desktops
                                                        onTouchStart={() =>
                                                            handleRemoveSigner(Number(key), pos.id)
                                                        } // For mobile
                                                    />
                                                </div>
                                            ))
                                    )}
                                </div>
                            );
                        })}
                    </Flex>
                </Flex>
            </DndProvider>
            {openSignersPopup && (
                <SignersPopup
                    open={openSignersPopup}
                    handleCancel={() => {
                        setOpenSignersPopup(false);
                        setTappedCoordinates(null);
                    }}
                    coordinates={tappedCoordinates}
                />
            )}
        </Flex>
    );
};

export default ThumbnailExample;
