// ==UserScript==
// @name        Kill Keyboard Shortcut on Github Notifications
// @namespace   Violentmonkey Scripts
// @icon        https://github.githubassets.com/favicons/favicon.svg
// @match       https://github.com/notifications*
// @grant       none
// @noframes    
// @version     0.1.1
// @author      y-saeki
// @supportURL  https://github.com/y-saeki/UserScript
// @description Kill all keyboard shortcuts on Github Notification screen because of that causes critical effect by easy operational error.
// ==/UserScript==

const target = document.querySelectorAll('[data-hotkey]');

for (i = 0; i < Object.keys(target).length; i++) {
  target[i].removeAttribute('data-hotkey');
}
