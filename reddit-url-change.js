// ==UserScript==
// @name         Reddit Direct Link
// @namespace    http://tampermonkey.net/
// @version      1.02
// @description  On New Reddit, makes post titles and post boxes link directly to the external website instead of the Reddit comments page.
// @author       narrowstacks
// @match        *://www.reddit.com/*
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
  "use strict";

  // List of Reddit media domains to preserve
  const REDDIT_MEDIA_DOMAINS = [
    "i.redd.it",
    "v.redd.it",
    "preview.redd.it",
    "i.reddit.com",
    "reddit.com/gallery",
  ];

  function isRedditMediaLink(url) {
    return REDDIT_MEDIA_DOMAINS.some((domain) => url.includes(domain));
  }

  function findExternalLink(post) {
    // First try to find the link in the thumbnail slot as it's most reliable
    const thumbnailSlot = post.shadowRoot.querySelector(
      'slot[name="thumbnail"]'
    );
    if (thumbnailSlot) {
      const elements = thumbnailSlot.assignedElements();
      for (const element of elements) {
        // Look for the direct link in the thumbnail area
        const links = element.querySelectorAll(
          'a[rel="noopener nofollow ugc"]'
        );
        for (const link of links) {
          // Skip if it's a Reddit media link
          if (isRedditMediaLink(link.href)) {
            return null;
          }
          if (
            !link.href.includes("/comments/") &&
            !link.href.includes("reddit.com")
          ) {
            return link;
          }
        }
      }
    }

    // Check content-href attribute first as it's more reliable than other slots
    const contentHref = post.getAttribute("content-href");
    if (contentHref) {
      if (isRedditMediaLink(contentHref)) {
        return null;
      }
      if (
        !contentHref.includes("/comments/") &&
        !contentHref.includes("reddit.com")
      ) {
        return { href: contentHref };
      }
    }

    // Fallback to other slots if needed
    const slotNames = ["title", "full-post-link", "content-href"];
    for (const slotName of slotNames) {
      const slot = post.shadowRoot.querySelector(`slot[name="${slotName}"]`);
      if (!slot) continue;

      const elements = slot.assignedElements();
      for (const element of elements) {
        // Check for links within the element
        const links = element.querySelectorAll("a");
        for (const link of links) {
          if (isRedditMediaLink(link.href)) {
            continue;
          }
          if (
            !link.href.includes("/comments/") &&
            !link.href.includes("reddit.com")
          ) {
            return link;
          }
        }

        // Check for href attribute on the element itself
        if (element.href) {
          if (isRedditMediaLink(element.href)) {
            continue;
          }
          if (
            !element.href.includes("/comments/") &&
            !element.href.includes("reddit.com")
          ) {
            return element;
          }
        }
      }
    }

    return null;
  }

  function modifyLinks() {
    const posts = document.querySelectorAll("shreddit-post");

    posts.forEach((post) => {
      // Check if post has shadowRoot
      if (!post.shadowRoot) {
        return;
      }

      // Find external link first
      const externalLink = findExternalLink(post);
      if (!externalLink) {
        return;
      }

      // Find and modify the title link
      const titleSlot = post.shadowRoot.querySelector('slot[name="title"]');
      if (titleSlot) {
        const titleElements = titleSlot.assignedElements();
        for (const element of titleElements) {
          const titleLink = element.querySelector("a");
          if (titleLink) {
            titleLink.href = externalLink.href;
            titleLink.addEventListener("click", (e) => {
              e.stopPropagation();
            });
          }
        }
      }

      // Find and modify the full-post link
      const fullPostLinkSlot = post.shadowRoot.querySelector(
        'slot[name="full-post-link"]'
      );
      if (fullPostLinkSlot) {
        const fullPostElements = fullPostLinkSlot.assignedElements();
        for (const element of fullPostElements) {
          if (element.tagName === "A") {
            element.href = externalLink.href;
            element.addEventListener("click", (e) => {
              e.stopPropagation();
            });
          }
        }
      }

      // Try to modify the post container
      const postContainer = post.shadowRoot.querySelector(".grid");
      if (postContainer) {
        postContainer.style.cursor = "pointer";
        postContainer.addEventListener("click", (e) => {
          // Check for any Reddit action buttons or interactive elements
          const interactive = e.target.closest(
            'button, a, [role="button"], shreddit-comment-action-row, [data-click-id="share"], [data-click-id="comments"], [data-click-id="save"], [data-testid="post-comment-header"], [data-click-id="upvote"], [data-click-id="downvote"]'
          );
          if (!interactive) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = externalLink.href;
          }
        });
      }
    });
  }

  // Wait for the page to be ready
  function init() {
    // Initial check
    modifyLinks();

    // Observe for dynamically loaded posts
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          setTimeout(modifyLinks, 100); // Small delay to ensure slots are populated
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Ensure the script runs after the page is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
