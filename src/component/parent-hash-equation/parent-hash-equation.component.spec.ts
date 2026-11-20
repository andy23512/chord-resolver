import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParentHashEquationComponent } from './parent-hash-equation.component';

describe('ParentHashEquationComponent', () => {
  let fixture: ComponentFixture<ParentHashEquationComponent>;

  const render = (numberList: number[]) => {
    fixture.componentRef.setInput('numberList', numberList);
    fixture.detectChanges();
  };
  const text = () =>
    (fixture.nativeElement as HTMLElement)
      .textContent!.replace(/\s+/g, ' ')
      .trim();
  const all = (selector: string) =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(selector),
    ).map((e) => e.textContent!.trim());
  const component = () => fixture.componentInstance;

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentHashEquationComponent);
  });

  describe('a chord with three or fewer actions', () => {
    it('joins the first three, 10 bits each, the first one lowest', () => {
      render([1, 2, 3, 0]);
      expect(component().parentHash()).toBe(1 + 2 * 1024 + 3 * 1024 * 1024);
      expect(component().parentHash()).toBe(3147777);
    });

    it('works for the second chord of the app sample', () => {
      render([879, 544, 518, 0, 0, 0, 0, 0, 0, 0, 97, 114]);
      expect(component().parentHash()).toBe(543720303);
    });

    it('works when only one of the three has a value', () => {
      render([0, 0, 5, 0]);
      expect(component().parentHash()).toBe(5 * 1024 * 1024);
      render([7, 0, 0, 0]);
      expect(component().parentHash()).toBe(7);
    });

    it('shows the number and the sum behind it', () => {
      render([879, 544, 518, 0]);
      expect(all('mi')).toEqual(['879', '544', '518']);
      expect(all('math msup')).toEqual(['10240', '10241', '10242']);
      expect(all('math mo')).toEqual(['(', '=', '×', '+', '×', '+', '×', ')']);
      expect(all('math > mrow > mrow > mn')[0]).toBe('543720303');
      expect(text()).toMatch(/^543720303 /);
      expect(text()).not.toContain('No parent');
    });
  });

  describe('no parent', () => {
    it('when there is a fourth action', () => {
      render([1, 2, 3, 4]);
      expect(component().parentHash()).toBeNull();
      expect(text()).toBe('(No parent)');
      expect(fixture.nativeElement.querySelector('math')).toBeNull();
    });

    it('when the first three are all zero, which would be a hash of 0', () => {
      render([0, 0, 0, 0]);
      expect(component().parentHash()).toBeNull();
      expect(text()).toBe('(No parent)');
    });

    it('for the first chord of the app sample', () => {
      render([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 108, 114]);
      expect(text()).toBe('(No parent)');
    });

    it('when the list has no fourth item at all', () => {
      render([1, 2, 3]);
      expect(component().parentHash()).toBeNull();
      expect(text()).toBe('(No parent)');
    });

    it('for an empty list', () => {
      render([]);
      expect(component().parentHash()).toBeNull();
      expect(text()).toBe('(No parent)');
    });
  });

  it('follows a change of the list', () => {
    render([1, 0, 0, 0]);
    expect(component().parentHash()).toBe(1);
    render([1, 0, 0, 9]);
    expect(component().parentHash()).toBeNull();
  });

  it('takes the first three items', () => {
    render([4, 5, 6, 0, 99]);
    expect(component().firstThreeItems()).toEqual([4, 5, 6]);
  });
});
