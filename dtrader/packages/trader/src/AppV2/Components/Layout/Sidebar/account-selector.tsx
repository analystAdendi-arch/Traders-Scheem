import { Button, Text } from '@deriv/components';
import { LegacyLogout1pxIcon } from '@deriv/quill-icons';
import { observer, useStore } from '@deriv/stores';
import { localize } from '@deriv-com/translations';

import { useMobileBridge } from '@deriv/api';

const AccountSelector = observer(() => {
    const { client, ui } = useStore();
    const { logout, is_logged_in } = client;
    const { closeSidebarFlyout } = ui;
    const { sendBridgeEvent, isBridgeAvailable } = useMobileBridge();

    const handleLogout = () => {
        closeSidebarFlyout();
        sendBridgeEvent('trading:back', () => {
            logout();
        });
    };

    const buttonText = isBridgeAvailable ? localize('Back to app') : localize('Log out');

    return (
        <div className='flyout-selector'>
            {is_logged_in && (
                <Button
                    className='flyout-selector__option'
                    onClick={handleLogout}
                    icon={<LegacyLogout1pxIcon iconSize='xs' fill='var(--color-text-primary)' />}
                >
                    <Text>{buttonText}</Text>
                </Button>
            )}
        </div>
    );
});

export default AccountSelector;
