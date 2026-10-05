/** Traders Scheem support line, shown as the WhatsApp button in the header and on the landing page. */
export const WHATSAPP_NUMBER = '+254741030460';

/** wa.me wants the number in international form with no '+' or spaces. */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;
