// ==UserScript==
// @name         Twitter/X - Clickable Original Images
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      5.0.1
// @license      AGPL-3.0-or-later
// @description  Middle-click post images to open the original file and show uncropped thumbnails, including the new ScrollSnap carousel layout.
// @author       marp; beckyeeky compatibility update
// @homepageURL  https://github.com/beckyeeky/myGMjs
// @source       https://greasyfork.org/scripts/376120
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20X%20Original%20Image%20Links.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20X%20Original%20Image%20Links.user.js
// @match        https://twitter.com/*
// @match        https://x.com/*
// @match        https://pbs.twimg.com/media/*
// @exclude      https://twitter.com/settings*
// @exclude      https://x.com/settings*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  const MEDIA_HOST = "pbs.twimg.com";
  const MEDIA_PATH = "/media/";
  const PROCESSED_ATTRIBUTE = "data-x-orig-image";
  const TARGET_ATTRIBUTE = "data-x-orig-image-url";

  function originalImageUrl(value) {
    try {
      const url = new URL(value, location.href);
      if (url.hostname !== MEDIA_HOST || !url.pathname.startsWith(MEDIA_PATH)) {
        return null;
      }

      // Current X media URLs use ?format=...&name=... . Keeping the format
      // supplied by the image element avoids guessing the file type.
      url.searchParams.set("name", "orig");
      return url.href;
    } catch (_error) {
      return null;
    }
  }

  function uncropImage(image) {
    image.style.setProperty("object-fit", "contain", "important");

    const photo = image.closest('[data-testid="tweetPhoto"]');
    if (!photo) return;

    // X currently renders both an img and a background-image. Update both;
    // do not replace position/margin styles because that breaks ScrollSnap.
    for (const background of photo.querySelectorAll('div[style*="background-image"]')) {
      background.style.setProperty("background-size", "contain", "important");
      background.style.setProperty("background-position", "center", "important");
      background.style.setProperty("background-repeat", "no-repeat", "important");
    }
  }

  function processImage(image) {
    if (!(image instanceof HTMLImageElement)) return;

    const source = image.currentSrc || image.src;
    const target = originalImageUrl(source);
    if (!target) return;

    // Restrict changes to actual post media. This excludes avatars and most
    // quoted-card artwork even if their implementation changes later.
    const photo = image.closest('[data-testid="tweetPhoto"]');
    const article = image.closest('article[data-testid="tweet"], article');
    const link = image.closest("a");
    if (!photo || !article || !link) return;

    // Accept both the old grid and the new ScrollSnap /photo/N carousel links.
    const isPhotoLink = /\/status\/\d+\/photo\/\d+(?:\b|\/|\?)/.test(link.href);
    if (!isPhotoLink && !link.hasAttribute(PROCESSED_ATTRIBUTE)) return;

    uncropImage(image);
    link.setAttribute(PROCESSED_ATTRIBUTE, "");
    link.setAttribute(TARGET_ATTRIBUTE, target);
    link.title = "Middle-click to open original image";
  }

  function processTree(root) {
    if (!(root instanceof Element || root instanceof Document)) return;

    if (root instanceof HTMLImageElement) processImage(root);
    for (const image of root.querySelectorAll('img[src*="pbs.twimg.com/media/"]')) {
      processImage(image);
    }
  }

  function installUncropStyles() {
    if (document.getElementById("x-orig-image-styles")) return;
    const style = document.createElement("style");
    style.id = "x-orig-image-styles";
    style.textContent = `
      [data-testid="tweetPhoto"] img[src*="pbs.twimg.com/media/"] {
        object-fit: contain !important;
      }
      [data-testid="tweetPhoto"] div[style*="background-image"] {
        background-size: contain !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function runOnTwitter() {
    const start = () => {
      installUncropStyles();
      processTree(document);

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) processTree(node);
          } else if (
            mutation.type === "attributes" &&
            mutation.target instanceof HTMLImageElement
          ) {
            processImage(mutation.target);
          } else if (
            mutation.type === "attributes" &&
            mutation.target instanceof HTMLAnchorElement
          ) {
            const image = mutation.target.querySelector(
              'img[src*="pbs.twimg.com/media/"]',
            );
            if (image) processImage(image);
          }
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "srcset", "href"],
      });

      // Preserve X's normal left-click photo viewer. Only a middle click opens
      // the original media URL in a new tab.
      document.addEventListener(
        "auxclick",
        (event) => {
          if (event.button !== 1 || !(event.target instanceof Element)) return;
          const link = event.target.closest(`a[${PROCESSED_ATTRIBUTE}]`);
          const target = link?.getAttribute(TARGET_ATTRIBUTE);
          if (!target) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          window.open(target, "_blank", "noopener,noreferrer");
        },
        true,
      );
    };

    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start, { once: true });
  }

  function runOnDirectImage() {
    const target = originalImageUrl(location.href);
    if (target && target !== location.href) location.replace(target);
  }

  if (location.hostname === MEDIA_HOST && location.pathname.startsWith(MEDIA_PATH)) {
    runOnDirectImage();
  } else {
    runOnTwitter();
  }
})();
