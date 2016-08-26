'use babel';

import AtomSleuth from '../lib/atom-sleuth';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('atom-sleuth', () => {

  describe('guess', () => {

    const createTextEditor = (lines, tabLength) => {
      return {
        getTabLength: () => {
          return tabLength;
        },
        getLineCount: () => {
          return lines.length;
        },
        lineTextForBufferRow: (i) => {
          return lines[i];
        },
        getGrammar: () => {
          return {
            tokenizeLine: () => {
              return {}
            }
          };
        }
      };
    };

    const guessTest = (lines, tabLength) => {
      let editor = createTextEditor(lines, tabLength);
      return AtomSleuth.guess(editor);
    };

    it('should return empty object for whitespace lines', () => {
      let result = guessTest([
        '',
        ' ',
        '\f\n\r\t\v\u00A0\u2028\u2029'
      ]);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should guess unexpanded tabs with lines containing tabs and no leading spaces', () => {
      let result = guessTest([
        '\thello',
        'world\t'
      ]);

      expect(result.expandTab).toBe(false);
    });

    it('should guess tab width with lines containing tabs and no leading spaces', () => {
      let tabWidth = 4;

      let result = guessTest([
        '\thello',
        'world\t'
      ], tabWidth);

      expect(result.shiftWidth).toBe(tabWidth);
    });

  });

});