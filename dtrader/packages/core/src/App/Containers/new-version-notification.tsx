import React from 'react';

interface NewVersionNotificationProps {
    onUpdate: () => void;
}

/**
 * Listens on emitted events to show notification on available updates.
 *  - IgnorePWAUpdate event will prevent notification
 *  - ListenPWAUpdate event is usefull to re-assign notify on update behavior
 * @param onUpdate
 * @return {null}
 * @constructor
 */
const NewVersionNotification: React.FC<NewVersionNotificationProps> = ({ onUpdate }) => {
    React.useEffect(() => {
        const removeUpdateListener = () => {
            document.removeEventListener('UpdateAvailable', onUpdate);
        };

        const addUpdateListener = () => {
            document.addEventListener('UpdateAvailable', onUpdate);
        };

        document.addEventListener('UpdateAvailable', onUpdate);
        document.addEventListener('IgnorePWAUpdate', removeUpdateListener);
        document.addEventListener('ListenPWAUpdate', addUpdateListener);

        return () => {
            document.removeEventListener('IgnorePWAUpdate', removeUpdateListener);
            document.removeEventListener('ListenPWAUpdate', addUpdateListener);
            document.removeEventListener('UpdateAvailable', onUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};

export default NewVersionNotification;
