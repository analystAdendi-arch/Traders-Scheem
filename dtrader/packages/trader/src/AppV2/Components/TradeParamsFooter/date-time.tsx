import React from 'react';

/**
 * DateTime component displays the current date and time in GMT/UTC timezone.
 *
 * Note: This component intentionally uses UTC time (GMT) as trading platforms
 * typically operate on a standardized timezone to ensure consistency across
 * different geographical locations and avoid confusion with local timezones.
 */
const DateTime: React.FC = React.memo(() => {
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = months[date.getUTCMonth()];
        const year = date.getUTCFullYear();

        return `${day} ${month} ${year}`;
    };

    const formatTime = (date: Date): string => {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds} GMT`;
    };

    return (
        <div className='trade-params-footer__datetime'>
            <div className='trade-params-footer__date'>{formatDate(currentTime)}</div>
            <div className='trade-params-footer__time'>{formatTime(currentTime)}</div>
        </div>
    );
});

DateTime.displayName = 'DateTime';

export default DateTime;
