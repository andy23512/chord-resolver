import { compressActions, decompressActions } from './action.util';

describe('compressActions', () => {
  it('gives nothing for no actions', () => {
    expect(compressActions([])).toEqual(new Uint8Array([]));
  });

  it('writes an action up to 0xff as one byte', () => {
    expect([...compressActions([0x20, 0x61, 0xff])]).toEqual([
      0x20, 0x61, 0xff,
    ]);
  });

  it('writes a bigger action as two bytes, the high one first', () => {
    expect([...compressActions([0x22e])]).toEqual([0x02, 0x2e]);
    expect([...compressActions([0x100])]).toEqual([0x01, 0x00]);
    expect([...compressActions([0x3ff])]).toEqual([0x03, 0xff]);
  });

  it('mixes one-byte and two-byte actions in order', () => {
    expect([...compressActions([0x22e, 0x6c, 0x23e])]).toEqual([
      0x02, 0x2e, 0x6c, 0x02, 0x3e,
    ]);
  });

  it('gives a Uint8Array that is exactly as long as what was written', () => {
    const out = compressActions([0x22e, 0x6c]);
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.length).toBe(3);
  });
});

describe('decompressActions', () => {
  it('gives nothing for nothing', () => {
    expect(decompressActions(new Uint8Array([]))).toEqual([]);
  });

  it('reads bytes from 32 up as actions on their own', () => {
    expect(decompressActions(new Uint8Array([0x20, 0x61, 0xff]))).toEqual([
      0x20, 0x61, 0xff,
    ]);
  });

  it('joins a byte from 1 to 31 with the byte after it', () => {
    expect(decompressActions(new Uint8Array([0x02, 0x2e]))).toEqual([0x22e]);
    expect(decompressActions(new Uint8Array([0x01, 0x00]))).toEqual([0x100]);
    expect(decompressActions(new Uint8Array([0x1f, 0xff]))).toEqual([0x1fff]);
  });

  it('keeps going after a joined pair, so the next byte starts a new action', () => {
    expect(
      decompressActions(new Uint8Array([0x02, 0x2e, 0x6c, 0x02, 0x3e])),
    ).toEqual([0x22e, 0x6c, 0x23e]);
  });

  it('keeps a zero byte as zero, without joining it with the next', () => {
    expect(decompressActions(new Uint8Array([0x00, 0x61]))).toEqual([0, 0x61]);
  });

  it('keeps a byte from 1 to 31 on its own when nothing follows it', () => {
    expect(decompressActions(new Uint8Array([0x61, 0x05]))).toEqual([0x61, 5]);
  });

  it('does not treat 31 and 32 alike: 31 joins, 32 does not', () => {
    expect(decompressActions(new Uint8Array([31, 7]))).toEqual([(31 << 8) | 7]);
    expect(decompressActions(new Uint8Array([32, 7]))).toEqual([32, 7]);
  });
});

describe('compressing and decompressing', () => {
  it('gives back the same actions, for codes of 32 and up', () => {
    const actions = [32, 33, 0x61, 0xff, 0x100, 0x22e, 0x3ff, 0x1234 & 0x3ff];
    expect(decompressActions(compressActions(actions))).toEqual(actions);
  });

  // The source says codes under 32 are invalid: a lone one joins whatever
  // comes after it, so it cannot be told from the first half of a pair.
  it('does not give back a code under 32 that is followed by another action', () => {
    expect(decompressActions(compressActions([5, 0x61]))).not.toEqual([
      5, 0x61,
    ]);
    expect(decompressActions(compressActions([5, 0x61]))).toEqual([0x561]);
  });
});
