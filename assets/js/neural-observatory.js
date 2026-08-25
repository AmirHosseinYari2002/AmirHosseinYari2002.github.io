(function () {
  "use strict";

  var navigation = document.querySelector("[data-neural-nav]");
  if (navigation) {
    var navigationToggle = navigation.querySelector("[data-nav-toggle]");
    var navigationLinks = navigation.querySelector("[data-nav-links]");

    function closeNavigation() {
      navigation.classList.remove("is-nav-open");
      if (navigationToggle) navigationToggle.setAttribute("aria-expanded", "false");
    }

    if (navigationToggle) {
      navigationToggle.addEventListener("click", function () {
        var willOpen = !navigation.classList.contains("is-nav-open");
        navigation.classList.toggle("is-nav-open", willOpen);
        navigationToggle.setAttribute("aria-expanded", String(willOpen));
      });
    }

    if (navigationLinks) {
      navigationLinks.addEventListener("click", function (event) {
        if (event.target.closest("a")) closeNavigation();
      });
    }

    document.addEventListener("click", function (event) {
      if (!navigation.contains(event.target)) closeNavigation();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNavigation();
    });
  }

  document.querySelectorAll(".author__urls-wrapper").forEach(function (wrapper) {
    var authorToggle = wrapper.querySelector("button");
    var authorLinks = wrapper.querySelector(".author__urls");
    if (!authorToggle || !authorLinks) return;

    authorToggle.setAttribute("aria-expanded", "false");
    authorToggle.addEventListener("click", function () {
      var willOpen = !authorLinks.classList.contains("is-open");
      authorLinks.classList.toggle("is-open", willOpen);
      authorToggle.classList.toggle("open", willOpen);
      authorToggle.setAttribute("aria-expanded", String(willOpen));
    });
  });

  var home = document.querySelector("[data-neural-home]");
  if (!home) return;

  document.body.classList.add("neural-observatory-page");

  var newsToggle = home.querySelector("[data-news-toggle]");
  if (newsToggle) {
    var newsExtras = home.querySelectorAll("[data-news-extra]");
    var newsToggleLabel = newsToggle.querySelector("[data-news-toggle-label]");

    newsToggle.addEventListener("click", function () {
      var isExpanded = newsToggle.getAttribute("aria-expanded") === "true";
      newsToggle.setAttribute("aria-expanded", String(!isExpanded));
      newsExtras.forEach(function (item) {
        item.hidden = isExpanded;
      });
      if (newsToggleLabel) {
        newsToggleLabel.textContent = isExpanded ? "View all news" : "Show less";
      }
    });
  }
})();
