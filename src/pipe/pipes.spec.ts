import { BinaryPipe } from './binary.pipe';
import { ChordInputBinaryChunkPipe } from './chord-input-binary-chunk.pipe';
import { DecimalPipe } from './decimal.pipe';

describe('BinaryPipe', () => {
  const pipe = new BinaryPipe();

  it('writes each hex digit as 4 binary digits', () => {
    expect(pipe.transform('1F')).toBe('00011111');
    expect(pipe.transform('A')).toBe('1010');
    expect(pipe.transform('0')).toBe('0000');
  });

  it('keeps the zeros in front, so the length is always 4 per hex digit', () => {
    expect(pipe.transform('0001')).toBe('0000000000000001');
    expect(pipe.transform('00FF')).toHaveLength(16);
  });

  it('reads lowercase hex too', () => {
    expect(pipe.transform('ff')).toBe('11111111');
  });

  it('writes a whole chord as 128 digits', () => {
    expect(pipe.transform('001C86C0000000000000000000000000')).toBe(
      '00000000' + '0001110010' + '0001101100' + '0'.repeat(100),
    );
  });

  it('refuses text that is not hex, and an empty string', () => {
    expect(() => pipe.transform('xyz')).toThrow(SyntaxError);
    expect(() => pipe.transform('')).toThrow(SyntaxError);
  });
});

describe('DecimalPipe', () => {
  const pipe = new DecimalPipe();

  it('reads binary digits as a number', () => {
    expect(pipe.transform('0')).toBe(0);
    expect(pipe.transform('101')).toBe(5);
    expect(pipe.transform('0001110010')).toBe(114);
    expect(pipe.transform('1111111111')).toBe(1023);
  });

  it('gives NaN for nothing', () => {
    expect(pipe.transform('')).toBeNaN();
  });
});

describe('ChordInputBinaryChunkPipe', () => {
  const pipe = new ChordInputBinaryChunkPipe();
  const bits = Array.from({ length: 128 }, (_, i) => String(i % 10)).join('');

  it('cuts 128 digits into one chunk of 8 and twelve chunks of 10', () => {
    const chunks = pipe.transform(bits);
    expect(chunks).toHaveLength(13);
    expect(chunks[0]).toBe(bits.slice(0, 8));
    expect(chunks.slice(1).every((c) => c.length === 10)).toBe(true);
    expect(chunks.join('')).toBe(bits);
  });

  it('puts the chunks in order, from the left', () => {
    const chunks = pipe.transform(bits);
    expect(chunks[1]).toBe(bits.slice(8, 18));
    expect(chunks[2]).toBe(bits.slice(18, 28));
    expect(chunks[12]).toBe(bits.slice(118, 128));
  });

  it('gives short or empty chunks when the input is short', () => {
    const chunks = pipe.transform('1010');
    expect(chunks).toHaveLength(13);
    expect(chunks[0]).toBe('1010');
    expect(chunks.slice(1).every((c) => c === '')).toBe(true);
  });

  it('ignores digits past 128', () => {
    expect(pipe.transform(bits + '1111').join('')).toBe(bits);
  });
});
