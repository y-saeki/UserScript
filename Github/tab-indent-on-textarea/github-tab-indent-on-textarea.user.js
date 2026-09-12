// ==UserScript==
// @name        Tab Indent on Github Textarea
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @version     0.1.2
// @author      y-saeki w/ AI Agent
// @supportURL  https://github.com/y-saeki/UserScript
// @description Insert spaces by Tab key and remove them by Shift+Tab on Github textarea, instead of moving focus.
// ==/UserScript==

// The event plumbing follows Refined Github's tab-to-indent feature and the
// libraries behind it (fregante's indent-textarea and text-field-edit), which
// are known to work on the current Github:
//   https://github.com/refined-github/refined-github/blob/main/source/features/tab-to-indent.tsx
//   https://github.com/fregante/text-field-edit
// The indentation itself is spaces instead of a tab character, which is the
// only reason this script exists rather than using Refined Github.

(function() {
  'use strict';

  // Tab size can be adjusted here (2, 4, etc.)
  const tabSize = 4;
  const spaces = ' '.repeat(tabSize);

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
  function editField(field, start, end, text, caret) {
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

    const position = typeof caret === 'number' ? caret : start + text.length;
    field.setSelectionRange(position, position);
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

    const start = field.selectionStart;
    const end = field.selectionEnd;
    if (start === null || end === null) {
      return;
    }

    // Check if any text is selected
    if (start !== end) {
      // Do not indent when text is selected because github-native indent feature is available.
      return;
    }

    // Stop the event for good: Github moves the focus away from the textarea on
    // Tab, and it does so from its own listeners rather than the default action
    event.preventDefault();
    event.stopImmediatePropagation();

    // Shift + Tab
    if (event.shiftKey) {
      const value = field.value;

      // Case 1: Spaces are directly before the cursor
      if (value.substring(start - tabSize, start) === spaces) {
        editField(field, start - tabSize, start, '');
        return;
      }

      // Case 2: Spaces are at the start of the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (value.substring(lineStart, lineStart + tabSize) === spaces) {
        editField(field, lineStart, lineStart + tabSize, '', Math.max(lineStart, start - tabSize));
      }
      return;
    }

    // Regular Tab
    editField(field, start, end, spaces);
  }

  // Listen on window in the capture phase. The capture phase starts here, so
  // this runs before anything Github attaches to document, to its React root or
  // to the textarea itself, whichever was registered first.
  window.addEventListener('keydown', onKeydown, true);

  // Lets you confirm from the devtools console which version is actually running
  window.tabIndentOnGithubTextarea = { version: '0.1.2' };
})();
