import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../../firebase/settings';
import Button from '../../../components/Button';

const SettingsView = () => {
    const [settings, setSettings] = useState({
        radius: 100,
        officeLocation: { lat: 0, lng: 0 },
        timeRules: {
            workStartTime: "09:00",
            workEndTime: "17:00",
            gracePeriodMinutes: 5,
            minOTMinutes: 60
        }
    });

    // Local state for form inputs
    const [radius, setRadius] = useState(100);
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);
    const [timeRules, setTimeRules] = useState({
        workStartTime: "09:00",
        workEndTime: "17:00",
        gracePeriodMinutes: 5,
        minOTMinutes: 60
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const s = await getSettings();
        if (s) {
            setSettings(s);
            setRadius(s.radius || 100);
            if (s.officeLocation) {
                setLat(s.officeLocation.lat);
                setLng(s.officeLocation.lng);
            }
            if (s.timeRules) {
                setTimeRules({ ...timeRules, ...s.timeRules });
            }
        }
        setLoading(false);
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        const updatedSettings = {
            ...settings,
            radius: Number(radius),
            officeLocation: { lat: Number(lat), lng: Number(lng) },
            timeRules: timeRules
        };
        await updateSettings(updatedSettings);
        setSettings(updatedSettings);
        alert('Settings updated!');
    };

    return (
        <div className="view-container">
            <h2>System Settings</h2>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <section className="settings-section card-panel" style={{ flex: 1, minWidth: '300px' }}>
                    <h3>Office Configuration</h3>
                    <form onSubmit={handleUpdateSettings} className="settings-form">
                        <label>
                            Allowed Radius (meters):
                            <input
                                type="number"
                                value={radius}
                                onChange={e => setRadius(e.target.value)}
                                className="input-field"
                            />
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <label style={{ flex: 1 }}>
                                Latitude:
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={lat}
                                    onChange={e => setLat(e.target.value)}
                                    className="input-field"
                                />
                            </label>
                            <label style={{ flex: 1 }}>
                                Longitude:
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={lng}
                                    onChange={e => setLng(e.target.value)}
                                    className="input-field"
                                />
                            </label>
                        </div>
                        <p className="stat-detail" style={{ marginTop: '0' }}>
                            You can get these from Google Maps (right-click a location).
                        </p>
                    </form>
                </section>

                <section className="settings-section card-panel" style={{ flex: 1, minWidth: '300px' }}>
                    <h3>Time & Attendance Rules</h3>
                    <form onSubmit={handleUpdateSettings} className="settings-form">
                        <label>
                            Work Start Time:
                            <input
                                type="time"
                                value={timeRules.workStartTime}
                                onChange={e => setTimeRules({ ...timeRules, workStartTime: e.target.value })}
                                className="input-field"
                            />
                        </label>
                        <label>
                            Work End Time:
                            <input
                                type="time"
                                value={timeRules.workEndTime}
                                onChange={e => setTimeRules({ ...timeRules, workEndTime: e.target.value })}
                                className="input-field"
                            />
                        </label>
                        <label>
                            Grace Period (Minutes):
                            <input
                                type="number"
                                value={timeRules.gracePeriodMinutes}
                                onChange={e => setTimeRules({ ...timeRules, gracePeriodMinutes: Number(e.target.value) })}
                                className="input-field"
                            />
                        </label>
                        <Button type="submit">Save All Settings</Button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default SettingsView;
