// ==UserScript==
// @name        Tab Indent on Github Textarea
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @version     0.1.1
// @author      y-saeki w/ AI Agent
// @supportURL  https://github.com/y-saeki/UserScript
// @description Insert spaces by Tab key and remove them by Shift+Tab on Github textarea, instead of moving focus.
// ==/UserScript==

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

  // Edit through the browser's own editing command so that the undo history,
  // the input event and React's internal value tracking all stay consistent.
  // Assigning to textarea.value directly leaves React's state untouched, and
  // the edit is reverted on the next render.
  function replaceRange(textarea, start, end, text, caret) {
    textarea.setSelectionRange(start, end);

    let done = false;
    try {
      done = text === ''
        ? document.execCommand('delete', false, null)
        : document.execCommand('insertText', false, text);
    } catch (e) {
      done = false;
    }

    if (!done) {
      const value = textarea.value;
      nativeValueSetter.call(textarea, value.substring(0, start) + text + value.substring(end));
      textarea.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: text === '' ? 'deleteContentBackward' : 'insertText',
        data: text === '' ? null : text
      }));
    }

    const position = typeof caret === 'number' ? caret : start + text.length;
    textarea.setSelectionRange(position, position);
  }

  function onKeydown(e) {
    if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    // Leave the key alone while an IME conversion is in progress
    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    if (!targetPath.test(location.pathname)) {
      return;
    }

    // Shadow DOM retargets event.target to its host element, so the real
    // element has to be read from the event path
    const path = typeof e.composedPath === 'function' ? e.composedPath() : null;
    const textarea = (path && path[0]) || e.target;
    if (!textarea || textarea.tagName !== 'TEXTAREA' || textarea.readOnly || textarea.disabled) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === null || end === null) {
      return;
    }

    // Check if any text is selected
    if (start !== end) {
      // Do not indent when text is selected because github-native indent feature is available.
      return;
    }

    // Stop the event here so that neither the browser nor Github's own handler
    // moves the focus away from the textarea
    e.preventDefault();
    e.stopPropagation();

    // Shift + Tab
    if (e.shiftKey) {
      const value = textarea.value;

      // Case 1: Spaces are directly before the cursor
      if (value.substring(start - tabSize, start) === spaces) {
        replaceRange(textarea, start - tabSize, start, '');
        return;
      }

      // Case 2: Spaces are at the start of the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (value.substring(lineStart, lineStart + tabSize) === spaces) {
        replaceRange(textarea, lineStart, lineStart + tabSize, '', start - tabSize);
      }
      return;
    }

    // Regular Tab
    replaceRange(textarea, start, end, spaces);
  }

  // Listen on the capture phase: Github's React root sits below document and
  // would otherwise handle the key first
  document.addEventListener('keydown', onKeydown, true);
})();
