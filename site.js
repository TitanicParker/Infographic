(() => {
  const page = document.body.dataset.page || "";
  const header = `
    <header class="global-header">
      <a class="global-brand" href="index.html" aria-label="Completed Intelligibility home">
        <span class="brand-mark" aria-hidden="true"><span></span></span>
        <span><strong>Completed Intelligibility</strong><small>The architecture of landing</small></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="global-navigation">Menu</button>
      <nav class="global-navigation" id="global-navigation" aria-label="Primary navigation">
        <a href="index.html" ${page === "home" ? 'aria-current="page"' : ""}>Home</a>
        <a href="infographics.html" ${page === "infographics" ? 'aria-current="page"' : ""}>Infographics</a>
        <a href="pitch.html" ${page === "pitch" ? 'aria-current="page"' : ""}>Pitch</a>
        <a href="concept.html" ${page === "concept" ? 'aria-current="page"' : ""}>Concept</a>
      </nav>
    </header>`;

  const footer = `
    <footer class="global-footer">
      <div>
        <strong>Completed Intelligibility</strong>
        <span>A visual and operational inquiry into how a sentence becomes complete enough to stand, survive and enter what follows.</span>
      </div>
      <nav aria-label="Footer navigation">
        <a href="infographics.html">Infographics</a>
        <a href="pitch.html">Read the pitch</a>
        <a href="concept.html">Explore the concept</a>
      </nav>
    </footer>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".global-navigation");
  toggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav?.addEventListener("click", event => {
    if (event.target.closest("a")) {
      document.body.classList.remove("nav-open");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      document.body.classList.remove("nav-open");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });

  const dialog = document.querySelector(".zoom-dialog");
  if (!dialog) return;

  const viewport = dialog.querySelector(".zoom-viewport");
  const canvas = dialog.querySelector(".zoom-canvas");
  const image = canvas.querySelector("img");
  const title = dialog.querySelector(".zoom-title");
  const original = dialog.querySelector(".zoom-original");
  const zoomIn = dialog.querySelector("[data-zoom-in]");
  const zoomOut = dialog.querySelector("[data-zoom-out]");
  const reset = dialog.querySelector("[data-zoom-reset]");
  const close = dialog.querySelector(".zoom-close");

  let scale = 1;
  let x = 0;
  let y = 0;
  let pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let lastTap = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const apply = () => {
    canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    viewport.classList.toggle("is-dragging", pointers.size > 0 && scale > 1);
  };
  const setScale = next => {
    scale = clamp(next, 1, 6);
    if (scale === 1) x = y = 0;
    apply();
  };
  const resetView = () => {
    scale = 1;
    x = 0;
    y = 0;
    apply();
  };
  const distance = values => {
    const [a, b] = values;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  document.querySelectorAll(".infographic-frame").forEach(button => {
    button.addEventListener("click", () => {
      const src = button.dataset.src;
      const label = button.dataset.title || "Infographic";
      image.src = src;
      image.alt = label;
      title.textContent = label;
      original.href = src;
      resetView();
      dialog.showModal();
    });
  });

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    image.removeAttribute("src");
    pointers.clear();
    resetView();
  });
  zoomIn.addEventListener("click", () => setScale(scale + .5));
  zoomOut.addEventListener("click", () => setScale(scale - .5));
  reset.addEventListener("click", resetView);

  viewport.addEventListener("wheel", event => {
    event.preventDefault();
    setScale(scale + (event.deltaY < 0 ? .25 : -.25));
  }, { passive: false });

  viewport.addEventListener("pointerdown", event => {
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, event);
    if (pointers.size === 2) {
      pinchStartDistance = distance([...pointers.values()]);
      pinchStartScale = scale;
    }
  });

  viewport.addEventListener("pointermove", event => {
    if (!pointers.has(event.pointerId)) return;
    const previous = pointers.get(event.pointerId);
    pointers.set(event.pointerId, event);

    if (pointers.size === 2) {
      const currentDistance = distance([...pointers.values()]);
      if (pinchStartDistance) setScale(pinchStartScale * currentDistance / pinchStartDistance);
      return;
    }
    if (scale > 1) {
      x += event.clientX - previous.clientX;
      y += event.clientY - previous.clientY;
      apply();
    }
  });

  const endPointer = event => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStartDistance = 0;
    apply();
  };
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener("click", event => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setScale(scale > 1 ? 1 : 2.5);
      event.preventDefault();
    }
    lastTap = now;
  });

  document.addEventListener("keydown", event => {
    if (!dialog.open) return;
    if (event.key === "+" || event.key === "=") setScale(scale + .5);
    if (event.key === "-") setScale(scale - .5);
    if (event.key === "0") resetView();
  });
})();
