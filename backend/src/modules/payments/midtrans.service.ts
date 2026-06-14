import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Use require for midtrans-client as it doesn't have proper TS types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const midtransClient = require('midtrans-client');

@Injectable()
export class MidtransService {
  private snap: any;
  private readonly logger = new Logger(MidtransService.name);

  constructor(private configService: ConfigService) {
    this.snap = new midtransClient.Snap({
      isProduction: this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true',
      serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
      clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
    });
  }

  async createTransaction(params: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    itemName: string;
  }) {
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: [
        {
          id: params.orderId,
          price: params.amount,
          quantity: 1,
          name: params.itemName.substring(0, 50),
        },
      ],
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone || '',
      },
      callbacks: {
        finish: `${this.configService.get('FRONTEND_URL')}/payment/success`,
        error: `${this.configService.get('FRONTEND_URL')}/payment/error`,
        pending: `${this.configService.get('FRONTEND_URL')}/payment/pending`,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      this.logger.log(`Midtrans transaction created: ${params.orderId}`);
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
      };
    } catch (error) {
      this.logger.error(`Midtrans error: ${error.message}`);
      throw error;
    }
  }

  async getTransactionStatus(orderId: string) {
    try {
      return await this.snap.transaction.status(orderId);
    } catch (error) {
      this.logger.error(`Midtrans status check error: ${error.message}`);
      throw error;
    }
  }

  verifySignature(payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    const crypto = require('crypto');
    const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
    const hash = crypto
      .createHash('sha512')
      .update(
        `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
      )
      .digest('hex');

    return hash === payload.signature_key;
  }
}
