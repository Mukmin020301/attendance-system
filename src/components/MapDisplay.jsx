import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const MapDisplay = ({ latitude, longitude, radius, officeLocation }) => {
    return (
        <div className="map-container-wrapper">
            <h3 className="section-title">Current Location</h3>
            <div className="map-frame">
                <MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[latitude, longitude]}>
                        <Popup>
                            You are here.
                        </Popup>
                    </Marker>

                    {officeLocation && radius && (
                        <>
                            <Circle
                                center={[officeLocation.lat, officeLocation.lng]}
                                radius={radius}
                                pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
                            />
                            <Marker position={[officeLocation.lat, officeLocation.lng]}>
                                <Popup>Office</Popup>
                            </Marker>
                        </>
                    )}
                    <RecenterMap lat={latitude} lng={longitude} />
                </MapContainer>
            </div>
        </div>
    );
};

export default MapDisplay;
