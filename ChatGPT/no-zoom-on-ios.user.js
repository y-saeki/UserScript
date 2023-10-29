// ==UserScript==
// @name        No Zoom on iOS
// @namespace   Violentmonkey Scripts
// @icon        https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.59f2e898.png
// @match       https://chat.openai.com/c/*
// @grant       none
// @noframes
// @version     0.1
// @author      y-saeki
// @supportURL  https://github.com/y-saeki/UserScript
// @description No Zoom on iOS
// ==/UserScript==

const viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
    const content = viewportMeta.getAttribute("content");
    if (content) {
        if (!content.includes("user-scalable=no")) {
            viewportMeta.setAttribute(
                "content",
                content + ", user-scalable=no"
            );
        }
    } else {
        viewportMeta.setAttribute("content", "user-scalable=no");
    }
} else {
    const newViewportMeta = document.createElement("meta");
    newViewportMeta.name = "viewport";
    newViewportMeta.content = "user-scalable=no";
    document.getElementsByTagName("head")[0].appendChild(newViewportMeta);
}
