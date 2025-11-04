import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'chordInputBinaryChunk',
})
export class ChordInputBinaryChunkPipe implements PipeTransform {
  transform(value: string): string[] {
    return [
      value.substring(0, 8),
      ...Array.from({ length: 12 }).map((_, i) =>
        value.substring(8 + i * 10, 18 + i * 10),
      ),
    ];
  }
}
