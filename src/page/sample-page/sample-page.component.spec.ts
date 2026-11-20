import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SAMPLE_SERIAL_OUTPUT } from '../../data/serial-output.const';
import { SamplePageComponent } from './sample-page.component';

const LINE_1 =
  'CML C1 1 001C86C0000000000000000000000000 022E6C696231023E 0 (l+r={dynamic_lib_action}lib1)';
// The second line of the real sample has two spaces before its label.
const LINE_2 =
  'CML C1 2 001C861000000000000000002068836F 61726D 0  (l+r|a+r=arm)';

describe('SamplePageComponent', () => {
  let fixture: ComponentFixture<SamplePageComponent>;
  let page: SamplePageComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(SamplePageComponent);
    page = fixture.componentInstance;
  });

  const render = (output?: string) => {
    if (output !== undefined) page.serialOutput.set(output);
    fixture.detectChanges();
  };
  const el = () => fixture.nativeElement as HTMLElement;
  const articles = () => Array.from(el().querySelectorAll('article'));
  const clean = (e: Element | null | undefined) =>
    (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
  /** The cells of the row whose first cell says `label`, without that first cell. */
  const row = (article: Element, label: string) => {
    const tr = Array.from(article.querySelectorAll('tr')).find((r) =>
      clean(r.querySelector('td')).startsWith(label),
    );
    return Array.from(tr!.querySelectorAll('td'))
      .slice(1)
      .map((td) => clean(td));
  };

  it('starts with the two chords of the app sample', () => {
    expect(page.serialOutput()).toBe(SAMPLE_SERIAL_OUTPUT);
    render();
    expect(articles()).toHaveLength(2);
    expect(page.serialOutput().split('\n')).toEqual([LINE_1, LINE_2]);
  });

  it('is dark, and takes the whole width', () => {
    const classes = el().classList;
    expect(classes.contains('bg-gray-900')).toBe(true);
    expect(classes.contains('text-white')).toBe(true);
    expect(classes.contains('block')).toBe(true);
  });

  describe('parsing', () => {
    it('reads the index, the chord and the phrase of each line', () => {
      expect(page.parsedResult()).toEqual([
        {
          serialOutput: LINE_1,
          index: 1,
          input: {
            hexString: '001C86C0000000000000000000000000',
            numberList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 108, 114],
            hash: 543720303,
          },
          output: [558, 108, 105, 98, 49, 574],
        },
        {
          serialOutput: LINE_2,
          index: 2,
          input: {
            hexString: '001C861000000000000000002068836F',
            numberList: [879, 544, 518, 0, 0, 0, 0, 0, 0, 0, 97, 114],
            hash: 216631165,
          },
          output: [97, 114, 109],
        },
      ]);
    });

    it('leaves out empty lines', () => {
      page.serialOutput.set(`\n${LINE_1}\n\n\n${LINE_2}\n`);
      expect(page.parsedResult().map((r) => r.index)).toEqual([1, 2]);
    });

    it('does not mind what is in the label at the end of the line', () => {
      page.serialOutput.set(LINE_2);
      expect(page.parsedResult()[0].output).toEqual([97, 114, 109]);
    });

    it('gives nothing for empty output, and follows a change of it', () => {
      page.serialOutput.set('');
      expect(page.parsedResult()).toEqual([]);
      render();
      expect(articles()).toHaveLength(0);
      render(LINE_1);
      expect(articles()).toHaveLength(1);
    });

    // Current behavior: a line is cut at spaces and the 4th and 5th parts are
    // used without a check, so a line that is too short stops the whole page.
    it('throws for a line with too few parts', () => {
      page.serialOutput.set('CML C1 1');
      expect(() => page.parsedResult()).toThrow(SyntaxError);
    });

    // Current behavior: only truly empty lines are left out, so a line of
    // spaces is read as a chord and fails the same way.
    it('throws for a line of only spaces', () => {
      page.serialOutput.set(`${LINE_1}\n   `);
      expect(() => page.parsedResult()).toThrow(SyntaxError);
    });
  });

  describe('first chord', () => {
    beforeEach(() => render());
    const first = () => articles()[0];

    it('is headed by its line', () => {
      expect(clean(first().querySelector('h4'))).toBe(`### ${LINE_1}`);
    });

    it('shows the hex string and the same chord in binary', () => {
      expect(row(first(), 'Hex')).toEqual(['001C86C0000000000000000000000000']);
      expect(row(first(), 'Bin')).toEqual([
        '00000000' + '0001110010' + '0001101100' + '0'.repeat(100),
      ]);
    });

    it('cuts the binary into 13 chunks: 8 bits, then twelve of 10', () => {
      const chunks = row(first(), 'Bin Chunks');
      expect(chunks).toHaveLength(13);
      expect(chunks.slice(0, 3)).toEqual([
        '00000000',
        '0001110010',
        '0001101100',
      ]);
      expect(chunks.slice(3).every((c) => c === '0'.repeat(10))).toBe(true);
    });

    it('shows the numbers of the chunks, leaving the first (8 bit) chunk empty', () => {
      expect(row(first(), 'Number List')).toEqual([
        '',
        '114',
        '108',
        ...Array(10).fill('0'),
      ]);
    });

    it('shows the same numbers the other way round, as in a chord backup', () => {
      expect(row(first(), 'Reversed Number List')).toEqual([
        '',
        ...Array(10).fill('0'),
        '108',
        '114',
      ]);
      const forward = row(first(), 'Number List').slice(1);
      const backward = row(first(), 'Reversed Number List').slice(1);
      expect([...forward].reverse()).toEqual(backward);
    });

    it('shows the hash', () => {
      expect(row(first(), 'Hash')).toEqual(['543720303']);
    });

    it('says it has no parent', () => {
      expect(row(first(), 'Parent Hash')).toEqual(['(No parent)']);
    });
  });

  describe('second chord', () => {
    beforeEach(() => render());
    const second = () => articles()[1];

    it('is headed by its line', () => {
      expect(second().querySelector('h4')!.textContent).toBe(`### ${LINE_2}`);
    });

    it('shows its numbers', () => {
      expect(row(second(), 'Reversed Number List')).toEqual([
        '',
        '879',
        '544',
        '518',
        ...Array(7).fill('0'),
        '97',
        '114',
      ]);
      expect(row(second(), 'Number List')).toEqual([
        '',
        '114',
        '97',
        ...Array(7).fill('0'),
        '518',
        '544',
        '879',
      ]);
    });

    it('shows its hash', () => {
      expect(row(second(), 'Hash')).toEqual(['216631165']);
    });

    it('shows its parent hash, which is the hash of the first chord', () => {
      const parent = row(second(), 'Parent Hash')[0];
      expect(parent).toMatch(/^543720303 /);
      expect(parent).not.toContain('No parent');
      expect(row(articles()[0], 'Hash')).toEqual(['543720303']);
      const mi = Array.from(second().querySelectorAll('mi')).map((e) =>
        clean(e),
      );
      expect(mi).toEqual(['879', '544', '518']);
    });
  });

  it('tells chords apart by their line: a moved chord keeps its drawing, a changed one gets a new one', () => {
    render();
    const [one, two] = articles();
    render(`${LINE_2}\n${LINE_1}`);
    expect(articles()[0]).toBe(two);
    expect(articles()[1]).toBe(one);
    render(`${LINE_2}\n${LINE_1.replace('lib1', 'changed')}`);
    expect(articles()[0]).toBe(two);
    expect(articles()[1]).not.toBe(one);
    expect(articles()[1].querySelector('h4')!.textContent).toContain('changed');
  });
});
