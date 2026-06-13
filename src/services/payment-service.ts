import { supabase } from '@/lib/supabase';

const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';
const CAMPAY_TOKEN = process.env.CAMPAY_TOKEN;

export interface PaymentInitiationResponse {
  reference: string;
  ussd_code?: string;
  operator?: string;
}

export interface TransactionStatus {
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  reference: string;
  amount: number;
  currency: string;
  operator: string;
  code: string;
}

export class PaymentService {
  /**
   * Initiates a collection (Payment from Buyer)
   */
  static async initiateCollection(params: {
    amount: number;
    phoneNumber: string; // Format: 2376xxxxxxxx
    description: string;
    externalReference: string;
  }): Promise<PaymentInitiationResponse> {
    if (!CAMPAY_TOKEN) {
      throw new Error('CAMPAY_TOKEN is not configured');
    }

    // Ensure amount is integer as per Campay requirements
    const amount = Math.floor(params.amount);

    const response = await fetch(`${CAMPAY_BASE_URL}/collect/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${CAMPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'XAF',
        from: params.phoneNumber,
        description: params.description,
        external_reference: params.externalReference,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Campay Collection Error:', data);
      throw new Error(data.detail || data.message || 'Payment initiation failed');
    }

    return data;
  }

  /**
   * Checks the status of a transaction
   */
  static async checkTransactionStatus(reference: string): Promise<TransactionStatus> {
    if (!CAMPAY_TOKEN) {
      throw new Error('CAMPAY_TOKEN is not configured');
    }

    const response = await fetch(`${CAMPAY_BASE_URL}/transaction/${reference}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${CAMPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Failed to check transaction status');
    }

    return data;
  }
}
