import { SAMPLE_SERIAL_OUTPUT } from '../data/serial-output.const';
import {
  deserializeActions,
  hashChord,
  parseChordActions,
  parsePhrase,
  serializeActions,
  stringifyChordActions,
  stringifyPhrase,
} from './raw-chord.util';

// The expected numbers below were worked out with a separate Python version
// of the same algorithm (not by running this code), and the two sample chords
// from the app are checked against each other: the second chord's parent
// hash is the first chord's hash.
const CHORD_1 = '001C86C0000000000000000000000000';
const CHORD_1_ACTIONS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 108, 114];
const CHORD_2 = '001C861000000000000000002068836F';
const CHORD_2_ACTIONS = [879, 544, 518, 0, 0, 0, 0, 0, 0, 0, 97, 114];

describe('parsePhrase', () => {
  it('reads pairs of hex digits as bytes and joins the two-byte actions', () => {
    expect(parsePhrase('022E6C696231023E')).toEqual([
      558, 108, 105, 98, 49, 574,
    ]);
    expect(parsePhrase('61726D')).toEqual([97, 114, 109]);
  });

  it('reads lowercase hex too', () => {
    expect(parsePhrase('022e6c')).toEqual([558, 108]);
  });

  it('gives nothing for an empty phrase', () => {
    expect(parsePhrase('')).toEqual([]);
  });

  // Current behavior: the length is halved and rounded down, so a last single
  // digit is dropped without a word.
  it('drops a last single hex digit', () => {
    expect(parsePhrase('616')).toEqual([0x61]);
  });
});

describe('stringifyPhrase', () => {
  it('writes the bytes as two uppercase hex digits each', () => {
    expect(stringifyPhrase([558, 108, 105, 98, 49, 574])).toBe(
      '022E6C696231023E',
    );
    expect(stringifyPhrase([97, 114, 109])).toBe('61726D');
  });

  it('pads a small byte with a zero', () => {
    expect(stringifyPhrase([0x20, 0x100])).toBe('200100');
  });

  it('gives an empty string for nothing', () => {
    expect(stringifyPhrase([])).toBe('');
  });

  it('is the opposite of parsePhrase', () => {
    for (const phrase of ['022E6C696231023E', '61726D', '']) {
      expect(stringifyPhrase(parsePhrase(phrase))).toBe(phrase);
    }
  });
});

describe('serializeActions', () => {
  it('puts each action in 10 bits, the last one highest', () => {
    expect(serializeActions([1])).toBe(1n << 110n);
    expect(serializeActions([1, 2])).toBe((1n << 100n) | (2n << 110n));
    expect(serializeActions([1, 2, 3])).toBe(0xc020040000000000000000000000n);
  });

  it('gives zero for no actions', () => {
    expect(serializeActions([])).toBe(0n);
  });

  it('keeps only the low 10 bits of each action', () => {
    expect(serializeActions([0x400])).toBe(0n);
    expect(serializeActions([0x7ff])).toBe(0x3ffn << 110n);
  });

  it('fills 120 bits with 12 actions', () => {
    expect(serializeActions(Array(12).fill(0x3ff))).toBe((1n << 120n) - 1n);
    expect(serializeActions(Array.from({ length: 12 }, (_, i) => i + 1))).toBe(
      0x300b0280902007018050100300801n,
    );
  });
});

describe('serializeActions with more than 12 actions', () => {
  // Current behavior: the shift for the 13th action from the end is negative,
  // and shifting a BigInt by a negative amount shifts the other way, so every
  // action before the last 12 is dropped without an error.
  it('drops the actions before the last 12', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(serializeActions([0x3ff, ...twelve])).toBe(serializeActions(twelve));
    expect(serializeActions([5, 6, 0x3ff, ...twelve])).toBe(
      serializeActions(twelve),
    );
  });
});

describe('deserializeActions', () => {
  it('reads 12 actions from the lowest bits up', () => {
    expect(deserializeActions(0n)).toEqual(Array(12).fill(0));
    expect(deserializeActions(0x3ffn)).toEqual([1023, ...Array(11).fill(0)]);
    expect(deserializeActions(1n << 110n)).toEqual([...Array(11).fill(0), 1]);
  });

  it('ignores bits above 120', () => {
    expect(deserializeActions(0xffn << 120n)).toEqual(Array(12).fill(0));
  });

  it('is the opposite of serializeActions for 12 actions', () => {
    const actions = Array.from({ length: 12 }, (_, i) => (i * 97 + 5) & 0x3ff);
    expect(deserializeActions(serializeActions(actions))).toEqual(actions);
  });

  // Current behavior: serialize puts the last action highest and deserialize
  // reads from the lowest, so fewer than 12 actions come back with zeros in
  // front.
  it('pads with zeros in front when there were fewer than 12 actions', () => {
    expect(deserializeActions(serializeActions([7, 8]))).toEqual([
      ...Array(10).fill(0),
      7,
      8,
    ]);
  });
});

describe('parseChordActions', () => {
  it('reads the chords of the app sample', () => {
    expect(parseChordActions(CHORD_1)).toEqual(CHORD_1_ACTIONS);
    expect(parseChordActions(CHORD_2)).toEqual(CHORD_2_ACTIONS);
  });

  it('reads lowercase hex, and a short string as a small number', () => {
    expect(parseChordActions(CHORD_2.toLowerCase())).toEqual(CHORD_2_ACTIONS);
    expect(parseChordActions('3ff')).toEqual([1023, ...Array(11).fill(0)]);
  });

  it('refuses text that is not hex', () => {
    expect(() => parseChordActions('xyz')).toThrow(SyntaxError);
    expect(() => parseChordActions('')).toThrow(SyntaxError);
  });
});

describe('stringifyChordActions', () => {
  it('writes 32 uppercase hex digits, with zeros in front', () => {
    expect(stringifyChordActions([])).toBe('0'.repeat(32));
    expect(stringifyChordActions([1, 2, 3])).toBe(
      '0000C020040000000000000000000000',
    );
    expect(stringifyChordActions(CHORD_2_ACTIONS)).toBe(CHORD_2);
    expect(stringifyChordActions(CHORD_1_ACTIONS)).toBe(CHORD_1);
  });

  it('is the opposite of parseChordActions', () => {
    expect(stringifyChordActions(parseChordActions(CHORD_2))).toBe(CHORD_2);
  });
});

describe('hashChord', () => {
  it('matches the values worked out separately', () => {
    expect(hashChord([])).toBe(694753541);
    expect(hashChord([1, 2, 3])).toBe(473800601);
    expect(hashChord([100])).toBe(858465476);
    expect(hashChord([100, 200, 300, 400])).toBe(450013480);
    expect(hashChord(Array(12).fill(1023))).toBe(117963128);
    expect(hashChord(Array.from({ length: 12 }, (_, i) => i + 1))).toBe(
      755044490,
    );
  });

  it('hashes the two chords of the app sample', () => {
    expect(hashChord(CHORD_1_ACTIONS)).toBe(543720303);
    expect(hashChord(CHORD_2_ACTIONS)).toBe(216631165);
  });

  it('keeps only 30 bits', () => {
    // the full 32-bit result of these is 3005949124 and 2597497128
    expect(hashChord([100])).toBeLessThan(2 ** 30);
    expect(hashChord([100, 200, 300, 400])).toBeLessThan(2 ** 30);
    expect(hashChord([100])).toBe(3005949124 & 0x3fffffff);
  });

  // A hash that would end in 0xff has its low byte flipped to 0x00 first.
  // For [104] and [361] the FNV result is 624071679 and 3941017343, and the
  // answer is what the same value gives with the last byte cleared.
  it('clears a low byte of 0xff before keeping 30 bits', () => {
    expect(hashChord([104])).toBe(624071424);
    expect(hashChord([361])).toBe(719791616);
    expect(hashChord([104]) & 0xff).toBe(0);
  });

  it('gives the same result for the same actions, and a different one when they change', () => {
    expect(hashChord([1, 2, 3])).toBe(hashChord([1, 2, 3]));
    expect(hashChord([1, 2, 3])).not.toBe(hashChord([1, 2, 4]));
    expect(hashChord([1, 2, 3])).not.toBe(hashChord([3, 2, 1]));
  });

  it('hashes the chord read from a line of the sample output', () => {
    const line = SAMPLE_SERIAL_OUTPUT.split('\n')[0].split(' ')[3];
    expect(hashChord(parseChordActions(line))).toBe(543720303);
  });
});
