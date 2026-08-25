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

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealItems = home.querySelectorAll("[data-reveal]");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  var canvas = home.querySelector("[data-neural-canvas]");
  var orbit = home.querySelector("[data-neural-orbit]");
  if (!canvas || !orbit || !canvas.getContext) return;

  var context = canvas.getContext("2d");
  var palette = ["55, 227, 255", "88, 149, 255", "189, 112, 255"];
  var particles = [];
  var animationFrame = null;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var running = true;
  var pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  var startedAt = performance.now();

  function seeded(index, salt) {
    var value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function makeParticles() {
    var count = width < 520 ? 18 : 28;
    particles = [];
    for (var i = 0; i < count; i += 1) {
      particles.push({
        ring: i % 5,
        angle: seeded(i, 1) * Math.PI * 2,
        speed: 0.000018 + seeded(i, 2) * 0.000025,
        size: 0.8 + seeded(i, 3) * 2.2,
        alpha: 0.28 + seeded(i, 4) * 0.7,
        color: palette[i % palette.length]
      });
    }
  }

  function resizeCanvas() {
    var bounds = orbit.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
    if (reduceMotion.matches) draw(performance.now());
  }

  function pointOnRing(ring, angle) {
    var scale = [0.37, 0.46, 0.56, 0.66, 0.77][ring];
    var tilt = [-0.22, 0.31, -0.48, 0.58, -0.12][ring];
    var radiusX = width * scale;
    var radiusY = height * scale * (ring % 2 === 0 ? 0.46 : 0.37);
    var x = Math.cos(angle) * radiusX;
    var y = Math.sin(angle) * radiusY;
    var cosTilt = Math.cos(tilt);
    var sinTilt = Math.sin(tilt);

    return {
      x: width / 2 + x * cosTilt - y * sinTilt + pointer.x,
      y: height / 2 + x * sinTilt + y * cosTilt + pointer.y
    };
  }

  function drawRing(ring) {
    var segments = 92;
    context.beginPath();
    for (var i = 0; i <= segments; i += 1) {
      var angle = (i / segments) * Math.PI * 2;
      var point = pointOnRing(ring, angle);
      if (i === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.strokeStyle = ring % 2 === 0 ? "rgba(55, 227, 255, 0.13)" : "rgba(189, 112, 255, 0.12)";
    context.lineWidth = 0.8;
    context.stroke();
  }

  function drawConnections(points) {
    for (var i = 0; i < points.length; i += 1) {
      var source = points[i];
      var target = points[(i + 7) % points.length];
      var dx = source.x - target.x;
      var dy = source.y - target.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > width * 0.31) continue;
      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.strokeStyle = "rgba(97, 184, 255, " + Math.max(0.02, 0.13 - distance / (width * 3)) + ")";
      context.lineWidth = 0.55;
      context.stroke();
    }
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * 0.035;
    pointer.y += (pointer.targetY - pointer.y) * 0.035;

    for (var ring = 0; ring < 5; ring += 1) drawRing(ring);

    var elapsed = reduceMotion.matches ? 0 : now - startedAt;
    var positions = particles.map(function (particle) {
      return pointOnRing(particle.ring, particle.angle + elapsed * particle.speed * (particle.ring % 2 ? -1 : 1));
    });

    drawConnections(positions);

    particles.forEach(function (particle, index) {
      var point = positions[index];
      context.beginPath();
      context.arc(point.x, point.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = "rgba(" + particle.color + ", " + particle.alpha + ")";
      context.shadowColor = "rgba(" + particle.color + ", 0.75)";
      context.shadowBlur = particle.size * 5;
      context.fill();
    });

    context.shadowBlur = 0;
    if (running && !reduceMotion.matches) animationFrame = requestAnimationFrame(draw);
  }

  function setRunning(next) {
    running = next;
    if (!running && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    } else if (running && !reduceMotion.matches && !animationFrame) {
      startedAt = performance.now();
      animationFrame = requestAnimationFrame(draw);
    }
  }

  orbit.addEventListener("pointermove", function (event) {
    var bounds = orbit.getBoundingClientRect();
    pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 13;
    pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 13;
  });

  orbit.addEventListener("pointerleave", function () {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  document.addEventListener("visibilitychange", function () {
    setRunning(!document.hidden);
  });

  if ("IntersectionObserver" in window) {
    var canvasObserver = new IntersectionObserver(function (entries) {
      setRunning(entries[0].isIntersecting && !document.hidden);
    }, { threshold: 0.02 });
    canvasObserver.observe(orbit);
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(orbit);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  reduceMotion.addEventListener && reduceMotion.addEventListener("change", function () {
    resizeCanvas();
    setRunning(!reduceMotion.matches && !document.hidden);
  });

  resizeCanvas();
  if (!reduceMotion.matches) animationFrame = requestAnimationFrame(draw);
})();
