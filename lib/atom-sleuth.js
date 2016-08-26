'use babel';

import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      this.detect(editor);
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  guess(editor) {
    let i = -1;
    let options = {};
    let tokenized = {ruleStack: null};
    let grammar = editor.getGrammar();
    let heuristics = {spaces: 0, hard: 0, soft: 0};
    const lines = Math.min(editor.getLineCount(), 1024);
    const softTab = new Array(8).reduce((str) => str.concat(' '), '');

    while (++i < lines) {
      const line = editor.lineTextForBufferRow(i);

      if (/^\s*$/.test(line)) {
        continue;
      }

      tokenized = grammar.tokenizeLine(line, tokenized.ruleStack, (i === 0));
      
      if (tokenized.ruleStack) {
        const rule = tokenized.ruleStack[tokenized.ruleStack.length - 1];
        if (rule && /^(comment|string)/.test(rule.scopeName)) {
          continue;
        }
      }

      if (/^\t/.test(line)) {
        ++heuristics.hard;
      } else if (new RegExp(`^${softTab}`).test(line)) {
        ++heuristics.soft;
      }

      if (/^  /.test(line)) {
        ++heuristics.spaces;
      }

      let shiftWidth = options.shiftWidth;
      if (isNaN(shiftWidth)) {
        shiftWidth = Number.MAX_VALUE;
      }

      const match = /^ */.exec(line.replace(/\t/g, softTab));
      const indent = match[0].length;
      if (indent > 1 && shiftWidth > indent) {
        options.shiftWidth = indent;
      }
    }

    if (heuristics.hard && !heuristics.spaces) {
      return {
        expandTab: false,
        shiftWidth: editor.getTabLength()
      };
    }

    if (heuristics.soft !== heuristics.hard) {
      options.expandTab = (heuristics.soft > heuristics.hard);
      if (heuristics.hard) {
        options.tabstop = 8;
      }
    }

    return options;
  },

  applyIfReady(editor, options) {
    const keys = Object.keys(options || {});
    if (keys.indexOf('expandTab') === -1 || keys.indexOf('shiftWidth') === -1) {
      return false;
    }

    keys.forEach((option) => {
      const value = options[option];
      switch (option) {
        case 'expandTab':
          editor.setSoftTabs(value);
          break;
        case 'shiftWidth':
          editor.setTabLength(value);
          break;
        default:
          break;
      }
    });

    return true;
  },

  detect(editor) {
    let options = this.guess(editor);
    if (this.applyIfReady(editor, options)) {
      return;
    }
  }

};