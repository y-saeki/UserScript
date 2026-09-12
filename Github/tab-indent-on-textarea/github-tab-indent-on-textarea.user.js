// ==UserScript==
// @name        Tab Indent on Github Textarea
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @version     0.2.0
// @author      y-saeki w/ AI Agent
// @supportURL  https://github.com/y-saeki/UserScript
// @description Indent lines by Tab key and unindent them by Shift+Tab on Github textarea, using spaces instead of moving focus.
// ==/UserScript==

// The event plumbing and the selection handling follow Refined Github's
// tab-to-indent feature and the libraries behind it (fregante's indent-textarea
// and text-field-edit), which are known to work on the current Github:
//   https://github.com/refined-github/refined-github/blob/main/source/features/tab-to-indent.tsx
//   https://github.com/fregante/indent-textarea
//   https://github.com/fregante/text-field-edit
// This script indents with spaces rather than a tab character, which is the only
// reason it exists rather than using Refined Github. It also indents the whole
// line instead of inserting at the cursor, so that Tab always means "indent".

(function() {
  'use strict';

  // Tab size can be adjusted here (2, 4, etc.)
  const tabSize = 4;
  const spaces = ' '.repeat(tabSize);

  // One level of indentation: either the spaces this script inserts, or a tab
  // character someone else left behind
  const indentation = new RegExp('^( {1,' + tabSize + '}|\t)');
  const lineIndentation = new RegExp('(^|\n)( {1,' + tabSize + '}|\t)', 'g');

  // Pages that hold a Markdown editor. This is checked on every keystroke
  // instead of relying on @match alone: Github moves between pages without a
  // full page load, while a userscript is injected only on a real navigation.
  // Matching the whole origin and filtering here keeps the script alive across
  // client-side navigation.
  const targetPath = /^\/[^/]+\/[^/]+\/(issues|pull|wiki|edit|compare)(\/|$)/;

  // React replaces the "value" property on the element itself, so the original
  // setter has to be taken from the prototype.
  const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

  function withFocus(field, callback) {
    const owner = field.ownerDocument;
    const initialFocus = owner.activeElement;

    if (initialFocus === field) {
      callback();
      return;
    }

    try {
      field.focus();
      callback();
    } finally {
      field.blur();
      if (initialFocus instanceof HTMLElement) {
        initialFocus.focus();
      }
    }
  }

  // Edit through the browser's own editing command. This is what keeps the undo
  // history intact and fires the input event that React listens to: assigning to
  // field.value leaves React's state untouched and the edit is reverted on the
  // next render.
  function editField(field, start, end, text) {
    const before = field.value;

    withFocus(field, function() {
      field.setSelectionRange(start, end);
      try {
        if (text === '') {
          field.ownerDocument.execCommand('delete');
        } else {
          field.ownerDocument.execCommand('insertText', false, text);
        }
      } catch (error) {
        // Handled by the fallback below
      }
    });

    if (field.value === before) {
      // execCommand was refused or did nothing. Write the value through the
      // prototype setter and announce the change, which keeps React in sync at
      // the cost of the undo history.
      nativeValueSetter.call(field, before.substring(0, start) + text + before.substring(end));
      field.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: text === '' ? 'deleteContentBackward' : 'insertText',
        data: text === '' ? null : text
      }));
    }
  }

  function lineStartBefore(value, position) {
    return value.lastIndexOf('\n', position - 1) + 1;
  }

  // Make sure the indentation of the last touched line is inside the range to
  // replace, even when the selection ends before it
  function findLineEnd(value, selectionEnd) {
    const lastLineStart = lineStartBefore(value, selectionEnd);
    const match = indentation.exec(value.substring(lastLineStart));
    if (!match) {
      return selectionEnd;
    }

    return Math.max(selectionEnd, lastLineStart + match[0].length);
  }

  function indentSelection(field) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const value = field.value;
    const firstLineStart = lineStartBefore(value, start);

    // The last line is indented only when the selection reaches past its line
    // break, hence the end of the range is one character before the selection
    const rangeEnd = Math.max(firstLineStart, end - 1);
    const text = value.substring(firstLineStart, rangeEnd);
    const indented = text.replace(/^|\n/g, '$&' + spaces);
    const added = indented.length - text.length;

    editField(field, firstLineStart, rangeEnd, indented);
    field.setSelectionRange(start + tabSize, end + added);
  }

  function unindentSelection(field) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const value = field.value;
    const firstLineStart = lineStartBefore(value, start);
    const rangeEnd = findLineEnd(value, end);

    const text = value.substring(firstLineStart, rangeEnd);
    const unindented = text.replace(lineIndentation, '$1');
    const removed = text.length - unindented.length;
    if (removed === 0) {
      return;
    }

    editField(field, firstLineStart, rangeEnd, unindented);

    // Keep the cursor where it was relative to the text, without letting it
    // escape the line when it sat inside the indentation
    const firstLineMatch = indentation.exec(value.substring(firstLineStart));
    const firstLineRemoved = firstLineMatch ? firstLineMatch[0].length : 0;
    const newStart = start - Math.min(firstLineRemoved, start - firstLineStart);
    field.setSelectionRange(newStart, Math.max(newStart, end - removed));
  }

  // Skip while the user is in the middle of something: during an IME conversion,
  // or while an autocomplete dropdown is open, Tab belongs to that interaction.
  function isInteractive(event, field) {
    return event.isComposing
      || field.getAttribute('aria-expanded') === 'true'
      || Boolean(field.form && field.form.querySelector('.suggester:not([hidden])'));
  }

  function onKeydown(event) {
    if (event.defaultPrevented || event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Shadow DOM retargets event.target to its host element, so the real element
    // has to be read from the event path
    const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
    const field = (path && path[0]) || event.target;
    if (!field || field.tagName !== 'TEXTAREA' || field.readOnly || field.disabled) {
      return;
    }

    if (!targetPath.test(location.pathname) || isInteractive(event, field)) {
      return;
    }

    if (field.selectionStart === null || field.selectionEnd === null) {
      return;
    }

    // Stop the event for good: Github moves the focus away from the textarea on
    // Tab, and it does so from its own listeners rather than the default action
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.shiftKey) {
      unindentSelection(field);
    } else {
      indentSelection(field);
    }
  }

  // Listen on window in the capture phase. The capture phase starts here, so
  // this runs before anything Github attaches to document, to its React root or
  // to the textarea itself, whichever was registered first.
  window.addEventListener('keydown', onKeydown, true);

  // Lets you confirm from the devtools console which version is actually running
  window.tabIndentOnGithubTextarea = { version: '0.2.0' };
})();
