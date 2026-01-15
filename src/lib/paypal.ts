const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export const paypal = {
    createOrder: async function createOrder(price: number) {
        const accessToken = await generateAccessToken();
        const response  = await fetch(base + '/v2/checkout/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: price
                    }
                }]
            })
        });
        return handleResponse(response);    
    },
    createPayment: async function createPayment(orderId: string) {
        const accessToken = await generateAccessToken();

        // const response = await fetch(base + '/v2/checkout/orders/' + orderId + '/' + 'CAPTURE', {
        const response = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        })
        return handleResponse(response);    
    }
}

async function generateAccessToken() {
    const auth = `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_APP_SECRET}`
    const response = await fetch(base + '/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
    });

    const jsonData = await handleResponse(response);
    return jsonData.access_token;
   
}

async function handleResponse(response: Response) {
    if (response.ok) {
        return response.json();
    } else {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    } 
}