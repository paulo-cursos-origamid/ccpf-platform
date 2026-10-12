import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

@Injectable()
export class ManualPaymentInstrumentService {
  generatePixCopyPaste(amount: number, reference: string): string {
    const value = amount.toFixed(2);
    const txid = reference
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 25)
      .padEnd(25, '0');

    const merchantAccount = this.field(
      '00',
      this.field('00', 'BR.GOV.BCB.PIX'),
    );

    const amountField = this.field('54', value);
    const country = this.field('58', 'BR');
    const currency = this.field('53', '986');
    const txidField = this.field('62', this.field('05', txid));

    const payloadWithoutCrc =
      '000201' +
      this.field('26', merchantAccount) +
      currency +
      amountField +
      country +
      txidField +
      '6304';

    return payloadWithoutCrc + this.crc16(payloadWithoutCrc);
  }

  generateBankSlipBarcode(amount: number, reference: string): string {
    const cents = Math.round(amount * 100)
      .toString()
      .padStart(12, '0');

    const seed = createHash('sha256')
      .update(reference)
      .digest('hex')
      .replace(/[^0-9]/g, '')
      .padEnd(32, '0');

    return ('836' + cents + seed.slice(0, 29)).slice(0, 44);
  }

  generateBankSlipDigitableLine(barcode: string): string {
    const field1 = barcode.slice(0, 11);
    const field2 = barcode.slice(11, 22);
    const field3 = barcode.slice(22, 33);
    const field4 = barcode.slice(33, 44);

    return (
      field1 +
      this.mod10(field1) +
      field2 +
      this.mod10(field2) +
      field3 +
      this.mod10(field3) +
      field4 +
      this.mod10(field4)
    ).slice(0, 47);
  }

  private field(id: string, value: string): string {
    return id + value.length.toString().padStart(2, '0') + value;
  }

  private crc16(payload: string): string {
    let crc = 0xffff;

    for (let index = 0; index < payload.length; index += 1) {
      crc ^= payload.charCodeAt(index) << 8;

      for (let bit = 0; bit < 8; bit += 1) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;

        crc &= 0xffff;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  private mod10(value: string): number {
    let multiplier = 2;
    let sum = 0;

    for (let index = value.length - 1; index >= 0; index -= 1) {
      let product = Number(value[index]) * multiplier;

      if (product > 9) {
        product = Math.floor(product / 10) + (product % 10);
      }

      sum += product;
      multiplier = multiplier === 2 ? 1 : 2;
    }

    return (10 - (sum % 10)) % 10;
  }
}
