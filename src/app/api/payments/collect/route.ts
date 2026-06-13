import { NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment-service';

export async function POST(request: Request) {
  try {
    const { amount, phoneNumber, description, externalReference } = await request.json();

    if (!amount || !phoneNumber) {
      return NextResponse.json(
        { message: 'Amount and phone number are required' },
        { status: 400 }
      );
    }

    const result = await PaymentService.initiateCollection({
      amount,
      phoneNumber,
      description: description || 'Order Payment',
      externalReference: externalReference || `tradam_${Date.now()}`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment API Error:', error);
    return NextResponse.json(
      { message: error.message || 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
