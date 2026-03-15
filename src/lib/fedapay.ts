export interface FedaPayTransaction {
  amount: number;
  description: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  currency?: string;
  callback_url?: string;
}

export async function createFedaPayTransaction(
  publicKey: string,
  mode: string,
  transaction: FedaPayTransaction
): Promise<{ url: string; id: string } | null> {
  try {
    const baseUrl = mode === 'live'
      ? 'https://api.fedapay.com/v1'
      : 'https://sandbox-api.fedapay.com/v1';

    const response = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicKey}`,
        'X-VERSION': '1',
      },
      body: JSON.stringify({
        description: transaction.description,
        amount: transaction.amount,
        currency: { iso: transaction.currency || 'XOF' },
        callback_url: transaction.callback_url || window.location.origin,
        customer: {
          firstname: transaction.customer_name.split(' ')[0],
          lastname: transaction.customer_name.split(' ').slice(1).join(' ') || '',
          email: transaction.customer_email || '',
          phone_number: {
            number: transaction.customer_phone,
            country: 'BJ',
          },
        },
      }),
    });

    const data = await response.json();

    if (data.v1_transaction) {
      const tokenResponse = await fetch(
        `${baseUrl}/transactions/${data.v1_transaction.id}/token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicKey}`,
            'X-VERSION': '1',
          },
        }
      );
      const tokenData = await tokenResponse.json();
      return {
        url: tokenData.url,
        id: data.v1_transaction.id.toString(),
      };
    }
    return null;
  } catch (error) {
    console.error('FedaPay error:', error);
    return null;
  }
}
