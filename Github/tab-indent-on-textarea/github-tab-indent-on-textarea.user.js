// ==UserScript==
// @name        Tab Indent on Github Textarea
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @version     0.2.1
// @author      y-saeki w/ AI Agent
// @supportURL  https://github.com/y-saeki/UserScript
// @description Indent lines by Tab key and unindent them by Shift+Tab on Github textarea, using spaces instead of moving focus.
// ==/UserScript==

// The event plumbing and the selection handling follow Refined Github's
// tab-to-indent feature and the libraries behind it (fregante's indent-textarea
// and text-field-edit), which are known to work on the current Github:
//   https://github.com/refined-github/refined-github/blob/main/source/features/tab-to-indent.tsx
//   https://github.com/refined-github/refined-github/blob/main/source/github-events/on-field-keydown.tsx
//   https://github.com/fregante/indent-textarea
//   https://github.com/fregante/text-field-edit
// This script indents with spaces rather than a tab character, which is the only
// reason it exists rather than using Refined Github. It also indents the whole
// line instead of inserting at the cursor, so that Tab always means "indent".

(function() {
  'use strict';

  const version = '0.2.1';

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

  // Report of the last Tab keystroke, readable from the devtools console. Github
  // renders its comment boxes with several different editors, so when the key is
  // ignored on one of them this is what says which check ignored it.
  const report = {
    version: version,
    debug: false,
    lastEvent: null
  };

  function describe(element) {
    if (!element || !element.tagName) {
      return String(element);
    }

    return {
      tagName: element.tagName,
      id: element.id || null,
      className: typeof element.className === 'string' ? element.className : null,
      contentEditable: element.isContentEditable || false,
      ariaExpanded: element.getAttribute && element.getAttribute('aria-expanded'),
      ariaAutocomplete: element.getAttribute && element.getAttribute('aria-autocomplete'),
      hasForm: Boolean(element.form)
    };
  }

  function record(entry) {
    report.lastEvent = entry;
    if (report.debug) {
      console.log('[tab-indent-on-github-textarea]', entry);
    }
    return entry;
  }

  // activeElement stops at the shadow host, so the focused element inside a
  // shadow root has to be followed down the tree
  function deepActiveElement(root) {
    let active = root.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }

    return active;
  }

  // Shadow DOM retargets event.target to its host element, so the real element
  // has to be read from the event path. The first entry is the element itself
  // in the common case, but Github nests the editor deep enough that a stray
  // wrapper can take its place, hence the search for the field in the path.
  function findField(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    for (let index = 0; index < path.length; index++) {
      const node = path[index];
      if (node && node.tagName === 'TEXTAREA') {
        return node;
      }
    }

    const active = deepActiveElement(document);
    if (active && active.tagName === 'TEXTAREA') {
      return active;
    }

    return (path.length > 0 && path[0]) || event.target;
  }

  function isVisible(element) {
    if (!element || element.hidden) {
      return false;
    }

    if (element.offsetParent !== null) {
      return true;
    }

    // offsetParent is null for a fixed-position element as well as a hidden one
    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  // Classic Github markup inserts the dropdown as .suggester inside the form
  // while it is open
  function openSuggester(field) {
    const form = field.form;
    if (!form) {
      return null;
    }

    const suggesters = form.querySelectorAll('.suggester');
    for (let index = 0; index < suggesters.length; index++) {
      if (isVisible(suggesters[index])) {
        return suggesters[index];
      }
    }

    return null;
  }

  // Primer markup marks the field as a combobox and points it at the listbox it
  // controls. aria-expanded on its own is not taken as an open dropdown: some of
  // Github's editors leave the attribute on the field permanently, which used to
  // make this script ignore every Tab on those editors.
  function openListbox(field) {
    if (field.getAttribute('aria-expanded') !== 'true') {
      return null;
    }

    // The listbox is looked up through the field rather than in the document at
    // large: an unrelated open listbox elsewhere on the page must not disable
    // the key inside the editor
    const id = field.getAttribute('aria-controls') || field.getAttribute('aria-owns');
    const scope = field.form || field.parentElement;
    const list = id ? field.ownerDocument.getElementById(id) : (scope && scope.querySelector('[role="listbox"]'));
    if (!list || !isVisible(list) || !list.querySelector('[role="option"]')) {
      return null;
    }

    return list;
  }

  // Skip while the user is in the middle of something: during an IME conversion,
  // or while an autocomplete dropdown is open, Tab belongs to that interaction.
  function interactionInProgress(event, field) {
    // keyCode 229 is the IME placeholder key, sent by browsers that leave
    // isComposing unset on the keydown that opens the conversion
    if (event.isComposing || event.keyCode === 229) {
      return 'composing';
    }

    if (openSuggester(field)) {
      return 'suggester';
    }

    if (openListbox(field)) {
      return 'autocomplete';
    }

    return null;
  }

  function withFocus(field, callback) {
    const owner = field.ownerDocument;
    if (deepActiveElement(owner) === field) {
      callback();
      return;
    }

    const initialFocus = owner.activeElement;
    try {
      field.focus();
      callback();
    } finally {
      // Only hand the focus back to whatever held it. Blurring the field
      // unconditionally would close the editor Github renders around it.
      if (initialFocus instanceof HTMLElement && initialFocus !== field) {
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

    if (field.value !== before) {
      return 'execCommand';
    }

    // execCommand was refused or did nothing. Write the value through the
    // prototype setter and announce the change, which keeps React in sync at
    // the cost of the undo history.
    nativeValueSetter.call(field, before.substring(0, start) + text + before.substring(end));
    field.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: text === '' ? 'deleteContentBackward' : 'insertText',
      data: text === '' ? null : text
    }));

    return field.value === before ? 'failed' : 'valueSetter';
  }

  // Record whether the edit survived the next render. A React editor that does
  // not accept the input event reverts the field, which looks exactly like the
  // key having been ignored.
  function verifyAfterRender(field, expected, entry) {
    setTimeout(function() {
      entry.afterRender = field.value === expected ? 'kept' : 'reverted';
      if (report.debug) {
        console.log('[tab-indent-on-github-textarea]', entry);
      }
    }, 0);
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

  function indentSelection(field, entry) {
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
    const expected = value.substring(0, firstLineStart) + indented + value.substring(rangeEnd);

    entry.edit = editField(field, firstLineStart, rangeEnd, indented);
    field.setSelectionRange(start + tabSize, end + added);
    verifyAfterRender(field, expected, entry);
  }

  function unindentSelection(field, entry) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const value = field.value;
    const firstLineStart = lineStartBefore(value, start);
    const rangeEnd = findLineEnd(value, end);

    const text = value.substring(firstLineStart, rangeEnd);
    const unindented = text.replace(lineIndentation, '$1');
    const removed = text.length - unindented.length;
    if (removed === 0) {
      entry.edit = 'nothingToUnindent';
      return;
    }

    const expected = value.substring(0, firstLineStart) + unindented + value.substring(rangeEnd);
    entry.edit = editField(field, firstLineStart, rangeEnd, unindented);

    // Keep the cursor where it was relative to the text, without letting it
    // escape the line when it sat inside the indentation
    const firstLineMatch = indentation.exec(value.substring(firstLineStart));
    const firstLineRemoved = firstLineMatch ? firstLineMatch[0].length : 0;
    const newStart = start - Math.min(firstLineRemoved, start - firstLineStart);
    field.setSelectionRange(newStart, Math.max(newStart, end - removed));
    verifyAfterRender(field, expected, entry);
  }

  function onKeydown(event) {
    if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const field = findField(event);
    const entry = {
      time: new Date().toISOString(),
      path: location.pathname,
      shiftKey: event.shiftKey,
      defaultPrevented: event.defaultPrevented,
      field: describe(field),
      handled: false
    };

    // event.defaultPrevented is reported but not obeyed. This listener runs
    // first in the capture phase, so anything that already handled the key did
    // so from a listener registered before the script - and Tab has to keep
    // meaning "indent" inside the editor either way.

    if (!field || field.tagName !== 'TEXTAREA') {
      entry.skipped = 'notATextarea';
      record(entry);
      return;
    }

    if (field.readOnly || field.disabled) {
      entry.skipped = 'fieldNotEditable';
      record(entry);
      return;
    }

    if (!targetPath.test(location.pathname)) {
      entry.skipped = 'pathNotMatched';
      record(entry);
      return;
    }

    const interaction = interactionInProgress(event, field);
    if (interaction) {
      entry.skipped = interaction;
      record(entry);
      return;
    }

    if (field.selectionStart === null || field.selectionEnd === null) {
      entry.skipped = 'noSelectionRange';
      record(entry);
      return;
    }

    // Stop the event for good: Github moves the focus away from the textarea on
    // Tab, and it does so from its own listeners rather than the default action
    event.preventDefault();
    event.stopImmediatePropagation();

    entry.handled = true;
    record(entry);

    if (event.shiftKey) {
      unindentSelection(field, entry);
    } else {
      indentSelection(field, entry);
    }
  }

  // Listen on window in the capture phase. The capture phase starts here, so
  // this runs before anything Github attaches to document, to its React root or
  // to the textarea itself, whichever was registered first.
  window.addEventListener('keydown', onKeydown, true);

  // Lets you confirm from the devtools console which version is actually
  // running, and why the last Tab keystroke was ignored
  window.tabIndentOnGithubTextarea = report;
})();
