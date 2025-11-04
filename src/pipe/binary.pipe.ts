import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'binary',
})
export class BinaryPipe implements PipeTransform {
  transform(value: string): string {
    const unpaddedBinaryString = BigInt(`0x${value}`).toString(2);
    const expectedLength = value.length * 4;
    return unpaddedBinaryString.padStart(expectedLength, '0');
  }
}
