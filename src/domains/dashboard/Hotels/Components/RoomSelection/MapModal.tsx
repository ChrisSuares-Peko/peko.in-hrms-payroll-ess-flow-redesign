import React from 'react';

interface MapViewProps {
  map: string; // "lat|lng"
}

const MapModal: React.FC<MapViewProps> = ({ map }) => {
 
  const [lat, lng] = map.split('|').map(Number);

  // Guard against invalid values
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error('Invalid map coordinates:', map);
    return null;
  }

  const mapSrc = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (              
    <div style={{ width: '100%', height: '100%',  overflow: 'hidden', marginTop:'10px' }}>
      <iframe
        title="Hotel Location"
        src={mapSrc}
        width="100%"
        height="100%" 
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default MapModal;
