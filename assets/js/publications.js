(function () {
  "use strict";

  function initPublications() {
    var root = document.querySelector("[data-publication-index]");
    if (!root) return;

    document.body.classList.add("publications-page");

    root.addEventListener("click", function (event) {
      var target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!target) return;

      var panelButton = target.closest("[data-panel-toggle]");
      if (panelButton && root.contains(panelButton)) {
        togglePanel(panelButton);
        return;
      }

      var authorButton = target.closest("[data-author-toggle]");
      if (authorButton && root.contains(authorButton)) {
        toggleAuthors(authorButton);
        return;
      }

      var copyButton = target.closest("[data-copy-target]");
      if (copyButton && root.contains(copyButton)) {
        copyBibtex(copyButton);
      }
    });

    var search = root.querySelector("[data-publication-search]");
    if (search) {
      search.addEventListener("input", function () {
        filterPublications(root, search.value);
      });
    }
  }

  function togglePanel(button) {
    var panel = document.getElementById(button.getAttribute("data-panel-toggle"));
    if (!panel) return;

    var willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.classList.toggle("is-open", willOpen);
    button.setAttribute("aria-expanded", willOpen ? "true" : "false");

    if (willOpen && window.matchMedia("(max-width: 48rem)").matches) {
      panel.focus({ preventScroll: true });
    }
  }

  function toggleAuthors(button) {
    var list = button.closest("[data-author-list]");
    if (!list) return;

    var shortAuthors = list.querySelector(".authors-short");
    var fullAuthors = list.querySelector(".authors-full");
    var label = button.querySelector("[data-author-toggle-label]");
    if (!shortAuthors || !fullAuthors || !label) return;

    var willOpen = fullAuthors.hidden;
    shortAuthors.hidden = willOpen;
    fullAuthors.hidden = !willOpen;
    button.setAttribute("aria-expanded", willOpen ? "true" : "false");
    label.textContent = willOpen ? "Hide authors" : "Show all authors";
  }

  function filterPublications(root, value) {
    var query = value.trim().toLocaleLowerCase();
    var visibleCount = 0;

    root.querySelectorAll("[data-publication-year]").forEach(function (yearGroup) {
      var yearHasMatch = false;

      yearGroup.querySelectorAll("[data-publication-card]").forEach(function (card) {
        var searchText = card.textContent.toLocaleLowerCase();
        var matches = !query || searchText.indexOf(query) !== -1;
        card.hidden = !matches;
        yearHasMatch = yearHasMatch || matches;
        if (matches) visibleCount += 1;
      });

      yearGroup.hidden = !yearHasMatch;
    });

    var empty = root.querySelector("[data-publication-empty]");
    if (empty) empty.hidden = visibleCount !== 0;
  }

  function copyBibtex(button) {
    var target = document.getElementById(button.getAttribute("data-copy-target"));
    if (!target) return;

    var text = target.textContent.trim();
    var original = button.textContent;

    copyText(text).then(function () {
      button.textContent = "Copied";
      window.setTimeout(function () {
        button.textContent = original;
      }, 1400);
    }).catch(function () {
      button.textContent = "Copy failed";
      window.setTimeout(function () {
        button.textContent = original;
      }, 1800);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy") ? resolve() : reject(new Error("Copy failed"));
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPublications, { once: true });
  } else {
    initPublications();
  }
})();
