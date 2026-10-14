// Notifications keys will not be added to localStorage and will appear again after user logout/login
export const excluded_notifications = ['contract_sold'];

export const maintenance_notifications = ['system_maintenance', 'site_maintenance'];

export const priority_toast_messages = ['trustpilot', 'svg', ...maintenance_notifications];
