// ==UserScript==
// @name         Reddit Direct Link
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  On New Reddit, makes post titles and post boxes link directly to the external website instead of the Reddit comments page.
// @author       narrowstacks
// @match        *://www.reddit.com/*
// @grant        none
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
            console.log("Skipping Reddit media link:", link.href);
            return null;
          }
          if (
            !link.href.includes("/comments/") &&
            !link.href.includes("reddit.com")
          ) {
            console.log("Found external link in thumbnail:", link.href);
            return link;
          }
        }
      }
    }

    // Check content-href attribute first as it's more reliable than other slots
    const contentHref = post.getAttribute("content-href");
    if (contentHref) {
      if (isRedditMediaLink(contentHref)) {
        console.log("Skipping Reddit media content:", contentHref);
        return null;
      }
      if (
        !contentHref.includes("/comments/") &&
        !contentHref.includes("reddit.com")
      ) {
        console.log(
          "Found external link in content-href attribute:",
          contentHref
        );
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
            console.log("Skipping Reddit media link:", link.href);
            continue;
          }
          if (
            !link.href.includes("/comments/") &&
            !link.href.includes("reddit.com")
          ) {
            console.log(`Found external link in ${slotName} slot:`, link.href);
            return link;
          }
        }

        // Check for href attribute on the element itself
        if (element.href) {
          if (isRedditMediaLink(element.href)) {
            console.log("Skipping Reddit media link:", element.href);
            continue;
          }
          if (
            !element.href.includes("/comments/") &&
            !element.href.includes("reddit.com")
          ) {
            console.log(
              `Found external link on ${slotName} element:`,
              element.href
            );
            return element;
          }
        }
      }
    }

    return null;
  }

  function modifyLinks() {
    console.log("Starting modifyLinks()...");
    const posts = document.querySelectorAll("shreddit-post");
    console.log(`Found ${posts.length} shreddit-post elements`);

    posts.forEach((post, index) => {
      console.log(`Processing post ${index + 1}:`);

      // Check if post has shadowRoot
      if (!post.shadowRoot) {
        console.log("No shadowRoot found for this post");
        return;
      }

      // Find external link first
      const externalLink = findExternalLink(post);
      if (!externalLink) {
        console.log("No external link found or post is Reddit media");
        return;
      }

      // Find and modify the title link
      const titleSlot = post.shadowRoot.querySelector('slot[name="title"]');
      if (titleSlot) {
        const titleElements = titleSlot.assignedElements();
        for (const element of titleElements) {
          const titleLink = element.querySelector("a");
          if (titleLink) {
            console.log("Modifying title link");
            titleLink.href = externalLink.href;
            titleLink.addEventListener("click", (e) => {
              console.log("Title click intercepted");
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
            console.log("Modifying full-post link");
            element.href = externalLink.href;
            element.addEventListener("click", (e) => {
              console.log("Full post link click intercepted");
              e.stopPropagation();
            });
          }
        }
      }

      // Try to modify the post container
      const postContainer = post.shadowRoot.querySelector(".grid");
      if (postContainer) {
        console.log("Found post container, modifying behavior");
        postContainer.style.cursor = "pointer";
        postContainer.addEventListener("click", (e) => {
          // Only redirect if not clicking on interactive elements
          const interactive = e.target.closest('button, a, [role="button"]');
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
    console.log("Initializing Reddit Direct Link script...");

    // Initial check
    modifyLinks();

    // Observe for dynamically loaded posts
    const observer = new MutationObserver((mutations) => {
      console.log("Mutation observed:", mutations.length, "changes");
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          console.log("New nodes added, running modifyLinks()");
          setTimeout(modifyLinks, 100); // Small delay to ensure slots are populated
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    console.log("MutationObserver set up");
  }

  // Ensure the script runs after the page is loaded
  if (document.readyState === "loading") {
    console.log("Page still loading, waiting for DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", init);
  } else {
    console.log("Page already loaded, running init immediately");
    init();
  }
})();
