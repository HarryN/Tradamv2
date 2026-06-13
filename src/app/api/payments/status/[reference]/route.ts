import { NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    if (!reference) {
      return NextResponse.json({ message: 'Reference is required' }, { status: 400 });
    }

    const result = await PaymentService.checkTransactionStatus(reference);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment Status API Error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
