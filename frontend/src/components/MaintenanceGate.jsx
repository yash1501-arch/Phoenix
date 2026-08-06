import React, { useEffect, useState } from 'react';
import Maintenance from '../pages/Maintenance';

const MaintenanceGate = ({ children }) => {
    const [maintenance, setMaintenance] = useState(null);

    useEffect(() => {
        const handler = (event) => {
            setMaintenance(event.detail || { message: 'Site is under maintenance. Please try again shortly.' });
        };
        window.addEventListener('maintenance:activated', handler);
        return () => window.removeEventListener('maintenance:activated', handler);
    }, []);

    if (maintenance) {
        return <Maintenance message={maintenance.message} />;
    }

    return children;
};

export default MaintenanceGate;
