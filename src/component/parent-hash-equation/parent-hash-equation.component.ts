import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-parent-hash-equation',
  templateUrl: 'parent-hash-equation.component.html',
})
export class ParentHashEquationComponent {
  numberList = input.required<number[]>();
  firstThreeItems = computed(() => this.numberList().slice(0, 3));
  parentHash = computed(() => {
    const numberList = this.numberList();
    if (numberList[3] !== 0) {
      return null;
    }
    const compound = this.firstThreeItems().reduce(
      (a, b, i) => a | (b << (i * 10)),
    );
    if (compound === 0) return null;
    return compound;
  });
}
