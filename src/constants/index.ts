export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
    ? process.env.PAYMENT_METHODS.split(', ')
: ['PayPal', 'Stripe', 'CashOnDelivery']

export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD || 'PayPal';
export const PAYPAL_API_URL = process.env.PAYPAL_API_URL || '';
export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
export const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET || '';