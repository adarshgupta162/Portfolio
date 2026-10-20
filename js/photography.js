(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const byId = id => document.getElementById(id);

  function normalizeCategory(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeSrc(value) {
    if (typeof value !== "string") return "";
    const src = value.trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
    if (!src) return "";
    if (/^(https?:|data:|blob:)/i.test(src)) return src;
    return encodeURI(src);
  }

  function normalizePhoto(photo) {
    if (!photo || typeof photo !== "object") return null;
    const category = normalizeCategory(photo.category);
    const src = normalizeSrc(photo.src);
    if (!category || !src) return null;
    const fallbackTitle = String(photo.title || photo.alt || "Untitled Photograph").trim() || "Untitled Photograph";
    return {
      title: fallbackTitle,
      location: String(photo.location || category.replace(/[-_]+/g, " ")).trim(),
      category,
      label: String(photo.label || category.replace(/[-_]+/g, " ").toUpperCase()).trim() || category.toUpperCase(),
      description: String(photo.description || "A moment captured by Adarsh.").trim(),
      src,
      alt: String(photo.alt || fallbackTitle).trim() || fallbackTitle
    };
  }

  const status = document.createElement("p");
  status.className = "gallery-status";
  status.hidden = true;
  const filterNav = byId("filters");
  filterNav.insertAdjacentElement("afterend", status);

  function setStatus(message = "") {
    status.hidden = !message;
    status.textContent = message;
  }

  const rawManifest = window.PHOTOGRAPHY_MANIFEST;
  const manifestPhotos = Array.isArray(rawManifest) ? rawManifest.map(normalizePhoto).filter(Boolean) : [];
  if (!Array.isArray(rawManifest)) {
    setStatus("Gallery data is unavailable. Run the photography manifest build before deploying.");
  } else if (manifestPhotos.length !== rawManifest.length) {
    setStatus("Some gallery entries were skipped because of invalid manifest data.");
  }

  const photos = manifestPhotos;
  let activePhotos = [...photos];
  let activeIndex = 0;
  let activeFilter = "all";

  const pad = n => String(n).padStart(2, "0");
  const getActive = () => activePhotos[activeIndex];
  const lightbox = byId("lightbox");
  const visibleCount = byId("visible-count");
  const featuredImage = byId("featured-image");
  const featuredCard = byId("open-featured");

  function markImageError(container, image, label) {
    if (!container || !image) return;
    container.classList.add("is-broken");
    image.removeAttribute("src");
    image.alt = `Image unavailable: ${label}`;
  }

  function setImage(image, src, alt, container) {
    if (!image) return;
    if (container) container.classList.remove("is-broken");
    image.alt = alt || "Photograph";
    image.onerror = () => markImageError(container, image, alt || "Photograph");
    image.src = src;
  }

  function renderStage() {
    if (!activePhotos.length) {
      byId("featured-title").textContent = "No photographs in this selection";
      byId("featured-location").textContent = activeFilter === "all"
        ? "Add images in photography/<category>/ and rebuild the manifest"
        : `No images in “${categoryLabel(activeFilter)}” yet`;
      byId("featured-category").textContent = activeFilter === "all" ? "EMPTY GALLERY" : "EMPTY CATEGORY";
      byId("current-index").textContent = "00";
      byId("total-index").textContent = "00";
      visibleCount.textContent = "00";
      $$(".stage-card[data-step]").forEach(card => { card.hidden = true; card.classList.remove("is-broken"); });
      featuredCard.classList.remove("is-broken");
      featuredImage.removeAttribute("src");
      [
        "#open-featured", "#prev-photo", "#prev-round", "#next-round", "#lightbox-prev", "#lightbox-next"
      ].forEach(selector => {
        const button = $(selector);
        if (button) button.disabled = true;
      });
      return;
    }

    [
      "#open-featured", "#prev-photo", "#prev-round", "#next-round", "#lightbox-prev", "#lightbox-next"
    ].forEach(selector => {
      const button = $(selector);
      if (button) button.disabled = false;
    });

    $$(".stage-card[data-step]").forEach(card => { card.hidden = false; card.classList.remove("is-broken"); });
    const current = getActive();
    setImage(featuredImage, current.src, current.alt, featuredCard);
    byId("featured-title").textContent = current.title;
    byId("featured-location").textContent = current.location;
    byId("featured-category").textContent = current.label;
    byId("current-index").textContent = pad(activeIndex + 1);
    byId("total-index").textContent = pad(activePhotos.length);
    visibleCount.textContent = pad(activePhotos.length);

    $$(".stage-card[data-step]").forEach(card => {
      const step = Number(card.dataset.step);
      const photo = activePhotos[(activeIndex + step + activePhotos.length) % activePhotos.length];
      const image = card.querySelector("img");
      setImage(image, photo.src, photo.alt, card);
      card.querySelector(".card-index").textContent = pad((activeIndex + step + activePhotos.length) % activePhotos.length + 1);
      card.hidden = activePhotos.length < 3;
    });
  }

  function renderGrid() {
    const grid = byId("photo-grid");
    grid.replaceChildren();
    if (!activePhotos.length) {
      const empty = document.createElement("p");
      empty.className = "gallery-empty";
      empty.textContent = activeFilter === "all"
        ? "No photographs found. Add supported images under photography/<category>/ and rebuild."
        : `No photographs in “${categoryLabel(activeFilter)}” yet.`;
      grid.append(empty);
      return;
    }

    activePhotos.forEach((photo, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-tile";
      button.innerHTML = `<img loading="lazy" decoding="async" alt=""><span class="tile-meta"><small></small><strong></strong><span></span></span>`;
      const image = $("img", button);
      setImage(image, photo.src, photo.alt, button);
      $("small", button).textContent = photo.label;
      $("strong", button).textContent = photo.title;
      $(".tile-meta span", button).textContent = photo.location;
      button.addEventListener("click", () => openLightbox(i));
      grid.append(button);
    });
  }

  function setIndex(index) {
    if (!activePhotos.length) return;
    activeIndex = (index + activePhotos.length) % activePhotos.length;
    renderStage();
  }

  function step(amount) {
    if (activePhotos.length) setIndex(activeIndex + amount);
  }

  function openLightbox(index) {
    if (!activePhotos.length) return;
    activeIndex = index;
    updateLightbox();
    if (!lightbox.open) lightbox.showModal();
    renderStage();
  }

  function updateLightbox() {
    const photo = getActive();
    const image = byId("lightbox-image");
    setImage(image, photo.src, photo.alt, image.closest("figure"));
    byId("lightbox-title").textContent = photo.title;
    byId("lightbox-location").textContent = `${photo.label} · ${photo.location}`;
    byId("lightbox-description").textContent = photo.description;
  }

  function lightboxStep(amount) {
    step(amount);
    updateLightbox();
  }

  byId("prev-photo").addEventListener("click", () => step(-1));
  byId("next-round").addEventListener("click", () => step(1));
  byId("prev-round").addEventListener("click", () => step(-1));
  byId("open-featured").addEventListener("click", () => openLightbox(activeIndex));
  $$(".stage-card[data-step]").forEach(card => card.addEventListener("click", () => step(Number(card.dataset.step))));
  byId("close-lightbox").addEventListener("click", () => lightbox.close());
  byId("lightbox-prev").addEventListener("click", () => lightboxStep(-1));
  byId("lightbox-next").addEventListener("click", () => lightboxStep(1));
  lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
  document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") lightbox.open ? lightboxStep(1) : step(1);
    if (event.key === "ArrowLeft") lightbox.open ? lightboxStep(-1) : step(-1);
  });

  const filterSpacer = filterNav.querySelector(".filter-spacer");
  const manifestCategories = Array.isArray(window.PHOTOGRAPHY_CATEGORIES)
    ? window.PHOTOGRAPHY_CATEGORIES.map(normalizeCategory).filter(Boolean)
    : [];
  const categories = [...new Set([...manifestCategories, ...photos.map(photo => photo.category).filter(Boolean)])]
    .sort((a, b) => a.localeCompare(b));

  function categoryLabel(category) {
    const labels = { streetlife: "Street life", street: "Street & life", nature: "Nature", travel: "Travel", details: "Details" };
    return labels[category] || category.replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  }

  function applyFilter(filter, button) {
    activeFilter = filter;
    $$(".filter-chip", filterNav).forEach(chip => chip.classList.toggle("is-active", chip === button));
    activePhotos = filter === "all" ? [...photos] : photos.filter(photo => photo.category === filter);
    activeIndex = 0;
    renderStage();
    renderGrid();
  }

  filterNav.querySelectorAll(".filter-chip").forEach(button => button.remove());
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "filter-chip is-active";
  allButton.dataset.filter = "all";
  allButton.textContent = "All moments";
  filterNav.insertBefore(allButton, filterSpacer);
  allButton.addEventListener("click", () => applyFilter("all", allButton));

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.dataset.filter = category;
    button.textContent = categoryLabel(category);
    filterNav.insertBefore(button, filterSpacer);
    button.addEventListener("click", () => applyFilter(category, button));
  });

  byId("year").textContent = new Date().getFullYear();
  renderStage();
  renderGrid();
})();
