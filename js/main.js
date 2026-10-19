(() => {
  const slides = [...document.querySelectorAll(".photo-slide")];
  const filters = [...document.querySelectorAll(".photo-filter")];
  const caption = document.querySelector("#photo-caption");
  const count = document.querySelector("#photo-count");
  const captions = [
    { title: "Mountain light", note: "A quiet place to pause and take it all in.", category: "nature" },
    { title: "Above the clouds", note: "Somewhere between leaving and arriving.", category: "travel" },
    { title: "The stillness", note: "A quiet place to pause and take it all in.", category: "travel" },
    { title: "Behind the lens", note: "Collecting moments, one frame at a time.", category: "street" },
    { title: "Blue horizons", note: "A little farther from the everyday.", category: "nature" }
  ];
  const positions = ["slide-far-left", "slide-left", "slide-center", "slide-right", "slide-far-right"];
  let active = 2, filter = "all";
  const archive = document.querySelector("#photo-archive");
  const archiveGrid = document.querySelector("#archive-grid");
  const lightbox = document.querySelector("#photo-lightbox");
  const lightboxImage = document.querySelector("#lightbox-image");
  const lightboxCaption = document.querySelector("#lightbox-caption");

  function visibleIndices() {
    return captions.map((item, i) => filter === "all" || item.category === filter ? i : -1).filter(i => i >= 0);
  }
  function render() {
    const visible = visibleIndices();
    if (!visible.includes(active)) active = visible[0] ?? 0;
    slides.forEach((slide, i) => {
      slide.classList.remove(...positions);
      const rel = (i - active + slides.length) % slides.length;
      const pos = rel === 0 ? 2 : rel === 1 ? 3 : rel === 2 ? 4 : rel === 3 ? 0 : 1;
      slide.classList.add(positions[pos]);
      slide.hidden = !visible.includes(i);
      slide.tabIndex = pos === 2 && visible.includes(i) ? 0 : -1;
      slide.setAttribute("aria-hidden", String(pos !== 2 || !visible.includes(i)));
    });
    count.innerHTML = `${String(active + 1).padStart(2, "0")} <i>/</i> ${String(slides.length).padStart(2, "0")}`;
    caption.textContent = captions[active].note;
  }
  function move(dir) {
    const visible = visibleIndices();
    const index = visible.indexOf(active);
    active = visible[(index + dir + visible.length) % visible.length];
    render();
  }
  function openPhoto(index) {
    active = index; render();
    lightboxImage.src = slides[index].querySelector("img").src;
    lightboxImage.alt = slides[index].querySelector("img").alt;
    lightboxCaption.textContent = `${String(index + 1).padStart(2, "0")} — ${captions[index].title}`;
    if (!lightbox.open) lightbox.showModal();
  }
  function buildArchive() {
    archiveGrid.innerHTML = "";
    visibleIndices().forEach(index => {
      const button = document.createElement("button");
      button.className = "archive-item";
      const img = document.createElement("img");
      img.src = slides[index].querySelector("img").src;
      img.alt = slides[index].querySelector("img").alt;
      const label = document.createElement("span");
      label.textContent = `${String(index + 1).padStart(2, "0")} / ${captions[index].title.toUpperCase()}`;
      button.append(img, label);
      button.addEventListener("click", () => openPhoto(index));
      archiveGrid.append(button);
    });
  }
  filters.forEach(button => button.addEventListener("click", () => {
    filter = button.dataset.filter;
    filters.forEach(b => {
      const selected = b === button;
      b.classList.toggle("is-active", selected);
      b.setAttribute("aria-pressed", String(selected));
    });
    render(); buildArchive();
  }));
  document.querySelector("#photo-prev").addEventListener("click", () => move(-1));
  document.querySelector("#photo-next").addEventListener("click", () => move(1));
  slides.forEach((slide, index) => slide.addEventListener("click", () => openPhoto(index)));
  document.querySelector("#archive-toggle").addEventListener("click", event => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(expanded));
    archive.hidden = !expanded;
    button.innerHTML = expanded ? 'Close photo archive <span>↖</span>' : 'Open photo archive <span>↗</span>';
    if (expanded) { buildArchive(); archive.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
  document.querySelector("#lightbox-close").addEventListener("click", () => lightbox.close());
  document.querySelector("#lightbox-prev").addEventListener("click", () => { move(-1); openPhoto(active); });
  document.querySelector("#lightbox-next").addEventListener("click", () => { move(1); openPhoto(active); });
  lightbox.addEventListener("click", e => { if (e.target === lightbox) lightbox.close(); });
  document.addEventListener("keydown", e => {
    if (!lightbox.open) return;
    if (e.key === "ArrowLeft") { move(-1); openPhoto(active); }
    if (e.key === "ArrowRight") { move(1); openPhoto(active); }
  });
  render(); buildArchive();
})();