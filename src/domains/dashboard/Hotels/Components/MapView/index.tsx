import React from 'react'

import { Button, Col, Flex, Image, Rate, Row, Typography } from 'antd'

import MapModal from '../RoomSelection/MapModal'
import Overview from '../RoomSelection/Overview'

interface MapProps {
    details: any
    selectedPrice: number
}

const Index = ({ details, selectedPrice }: MapProps) => {
    const locationString = details?.location
    const firstImage = details?.images?.[0]

    return (
        <Row
            
            className="mt-5"
            style={{ alignItems: 'stretch' }} 
        >
    
            <Col
                xl={9}
                sm={24}
                className="p-3"
                style={{
                    background: '#F9F9F9',
                    display: 'flex',          
                }}
            >
                <Flex
                    vertical
                    className="p-5 bg-white rounded-lg"
                    style={{ flex: 1 }}        
                >
                    <Typography.Text
                        className="font-medium"
                        style={{ fontSize: '1.3rem' }}
                    >
                        {details?.name}
                    </Typography.Text>

                    <Typography.Text
                        className="text-sm text-slate-500 mt-1"
                    >
                        {locationString
                            ?.replace(/,([^ ])/g, ', $1')
                            .replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </Typography.Text>

                    <Image
                        width="100%"
                        className="rounded-lg mt-3"
                        src={firstImage}
                    />

                    <Rate
                        disabled
                        value={details?.reviews}
                        className="text-sm mt-3"
                    />

                    <Overview
                        description={details?.description}
                        facilities={details?.facilities}
                    />

                
                    <Flex vertical className="mt-auto">
                        <Typography.Text
                            className="font-medium"
                            style={{ fontSize: '1.3rem' }}
                        >
                            ₹{selectedPrice}
                        </Typography.Text>

                        <Button
                            danger
                            type="default"
                            className="w-full rounded-lg mt-2"
                        >
                            Explore Rooms
                        </Button>
                    </Flex>
                </Flex>
            </Col>

          
            <Col
                xl={15}
                sm={24}
                style={{
                    display: 'flex',         
                }}
            >
                {details?.map && (
                    <MapModal map={details.map} />  
                )}
            </Col>
        </Row>
    )
}

export default Index
