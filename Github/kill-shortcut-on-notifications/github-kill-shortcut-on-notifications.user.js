// ==UserScript==
// @name        Kill Keyboard Shortcut on Github Notifications
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/notifications*
// @grant       none
// @version     0.1.0
// @author      y-saeki
// @description Kill all keyboard shortcuts on Github Notification screen because of that causes critical effect by easy operational error.
// @supportURL  
// ==/UserScript==

const target = document.querySelectorAll('[data-hotkey]');

for (i = 0; i < Object.keys(target).length; i++) {
  target[i].removeAttribute('data-hotkey');
}
