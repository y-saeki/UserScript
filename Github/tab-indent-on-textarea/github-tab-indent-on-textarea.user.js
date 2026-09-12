// ==UserScript==
// @name        Tab Indent on Github Textarea
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/*/*/issues/*
// @match       https://github.com/*/*/pull/*
// @match       https://github.com/*/*/wiki/*
// @match       https://github.com/*/*/edit/*
// @match       https://github.com/*/*/compare/*
// @grant       none
// @noframes
// @version     0.1.0
// @author      y-saeki w/ AI Agent
// @supportURL  https://github.com/y-saeki/UserScript
// @description Insert spaces by Tab key and remove them by Shift+Tab on Github textarea, instead of moving focus.
// ==/UserScript==

(function() {
  'use strict';

  // Tab size can be adjusted here (2, 4, etc.)
  const tabSize = 4;
  const spaces = ' '.repeat(tabSize);

  document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'TEXTAREA') {
          const textarea = e.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;

          // Check if any text is selected
          if (start !== end) {
              // Do not indent when text is selected because github-native indent feature is available.
              return;
          }

          // Tab key pressed
          if (e.keyCode === 9) {
              e.preventDefault();

              // Shift + Tab
              if (e.shiftKey) {
                  // Case 1: Spaces are directly before the cursor
                  if (textarea.value.substring(start - tabSize, start) === spaces) {
                      textarea.value = textarea.value.substring(0, start - tabSize) + textarea.value.substring(end);
                      textarea.selectionStart = textarea.selectionEnd = start - tabSize;
                  } else {
                      // Case 2: Spaces are at the start of the current line
                      const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
                      if (textarea.value.substring(lineStart, lineStart + tabSize) === spaces) {
                          textarea.value = textarea.value.substring(0, lineStart) + textarea.value.substring(lineStart + tabSize);
                          textarea.selectionStart = textarea.selectionEnd = start - tabSize;
                      }
                  }
              } else {
                  // Regular Tab
                  textarea.value = textarea.value.substring(0, start) + spaces + textarea.value.substring(end);
                  textarea.selectionStart = textarea.selectionEnd = start + tabSize;
              }
          }
      }
  });
})();
