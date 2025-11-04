import { Component, computed, signal } from '@angular/core';
import { ParentHashEquationComponent } from '../../component/parent-hash-equation/parent-hash-equation.component';
import { SAMPLE_SERIAL_OUTPUT } from '../../data/serial-output.const';
import { BinaryPipe } from '../../pipe/binary.pipe';
import { ChordInputBinaryChunkPipe } from '../../pipe/chord-input-binary-chunk.pipe';
import { DecimalPipe } from '../../pipe/decimal.pipe';
import {
  hashChord,
  parseChordActions,
  parsePhrase,
} from '../../util/raw-chord.util';

interface ParsedResultItem {
  serialOutput: string;
  index: number;
  input: {
    hexString: string;
    numberList: number[];
    hash: number;
  };
  output: number[];
}

@Component({
  selector: 'app-sample-page',
  templateUrl: 'sample-page.component.html',
  imports: [
    BinaryPipe,
    ChordInputBinaryChunkPipe,
    DecimalPipe,
    ParentHashEquationComponent,
  ],
  host: {
    class: 'bg-gray-900 text-white block',
  },
})
export class SamplePageComponent {
  public serialOutput = signal(SAMPLE_SERIAL_OUTPUT);
  public parsedResult = computed<ParsedResultItem[]>(() =>
    this.serialOutput()
      .split('\n')
      .filter((v) => !!v)
      .map((line) => {
        const [, , indexInString, chordActions, phrase] = line.split(' ');
        const inputInNumberList = parseChordActions(chordActions);
        return {
          serialOutput: line,
          index: +indexInString,
          input: {
            hexString: chordActions,
            numberList: inputInNumberList,
            hash: hashChord(inputInNumberList),
          },
          output: parsePhrase(phrase),
        };
      }),
  );
}
