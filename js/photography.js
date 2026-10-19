(() => {
  // Replace these sample image URLs and descriptions with your own photographs.
  // Put local files in assets/ and use paths such as "assets/varanasi-ghat.jpg".
  const samplePhotos = [
    { title: "A little further away", location: "Dolomites, Italy", category: "travel", label: "TRAVEL NOTES", description: "A quiet pause beside cold water, with the mountains holding the whole scene still.", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88", alt: "Mountain landscape under a soft sky" },
    { title: "Clouds at golden hour", location: "Somewhere above the clouds", category: "nature", label: "OPEN SKIES", description: "The kind of light that makes even an ordinary journey feel cinematic.", src: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1400&q=88", alt: "Sunlight falling through a forest" },
    { title: "Blue, all the way through", location: "Alpine lake", category: "travel", label: "WATER & STONE", description: "A landscape built from reflections, stillness, and the smallest movement.", src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=88", alt: "Lake and mountains" },
    { title: "Little things, noticed", location: "A slow afternoon", category: "details", label: "SMALL DETAILS", description: "Sometimes the details tell you more than the whole picture.", src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=88", alt: "Camera on a table" },
    { title: "Where the road bends", location: "Mountain country", category: "nature", label: "OUT THERE", description: "A reminder to leave a little room in the plan for the unexpected.", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=88", alt: "Dramatic mountain peaks" },
    { title: "The city in motion", location: "A passing moment", category: "street", label: "STREET & LIFE", description: "A brief frame from the world moving around me.", src: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=88", alt: "City lights at dusk" },
    { title: "Into the quiet", location: "Forest trail", category: "nature", label: "GREEN PAUSES", description: "A little distance from the noise, and a little closer to the present.", src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=88", alt: "Path through a green forest" },
    { title: "Last light on the water", location: "Evening somewhere", category: "travel", label: "AFTER HOURS", description: "The final minutes of daylight, saved for later.", src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=88", alt: "Ocean water at sunset" }
  ];

  // The build script scans photography/<category>/ and generates this manifest.
  // Sample images keep the page previewable until personal photos are added.
  const manifestPhotos = Array.isArray(window.PHOTOGRAPHY_MANIFEST) ? window.PHOTOGRAPHY_MANIFEST : [];
  const photos = manifestPhotos.length ? manifestPhotos : samplePhotos;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let activePhotos = [...photos];
  let activeIndex = 0;

  const pad = n => String(n).padStart(2, "0");
  const getActive = () => activePhotos[activeIndex];

  function renderStage() {
    if (!activePhotos.length) {
      $("#featured-title").textContent = "A new collection is coming";
      $("#featured-location").textContent = "Add photographs to this folder";
      $("#featured-category").textContent = "COMING SOON";
      $("#current-index").textContent = "00";
      $("#total-index").textContent = "00";
      $("#visible-count").textContent = "00";
      $$(".stage-card[data-step]").forEach(card => { card.hidden = true; });
      $("#featured-image").removeAttribute("src");
      ["#open-featured", "#prev-photo", "#prev-round", "#next-round", "#lightbox-prev", "#lightbox-next"].forEach(selector => { const button = $(selector); if (button) button.disabled = true; });
      return;
    }
    ["#open-featured", "#prev-photo", "#prev-round", "#next-round", "#lightbox-prev", "#lightbox-next"].forEach(selector => { const button = $(selector); if (button) button.disabled = false; });
    $$(".stage-card[data-step]").forEach(card => { card.hidden = false; });
    const current = getActive();
    $("#featured-image").src = current.src;
    $("#featured-image").alt = current.alt;
    $("#featured-title").textContent = current.title;
    $("#featured-location").textContent = current.location;
    $("#featured-category").textContent = current.label;
    $("#current-index").textContent = pad(activeIndex + 1);
    $("#total-index").textContent = pad(activePhotos.length);
    $("#visible-count").textContent = pad(activePhotos.length);

    $$(".stage-card[data-step]").forEach(card => {
      const step = Number(card.dataset.step);
      const photo = activePhotos[(activeIndex + step + activePhotos.length) % activePhotos.length];
      card.querySelector("img").src = photo.src;
      card.querySelector("img").alt = photo.alt;
      card.querySelector(".card-index").textContent = pad((activeIndex + step + activePhotos.length) % activePhotos.length + 1);
      card.hidden = activePhotos.length < 3;
    });
  }

  function renderGrid() {
    const grid = $("#photo-grid");
    grid.replaceChildren();
    if (!activePhotos.length) {
      const empty = document.createElement("p");
      empty.className = "gallery-empty";
      empty.textContent = "No photographs here yet. Add images to this folder and rebuild the gallery.";
      grid.append(empty);
      return;
    }
    activePhotos.forEach((photo, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-tile";
      button.innerHTML = `<img loading="lazy" alt=""><span class="tile-meta"><small></small><strong></strong><span></span></span>`;
      $("img", button).src = photo.src;
      $("img", button).alt = photo.alt;
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
  function step(amount) { if (activePhotos.length) setIndex(activeIndex + amount); }

  const lightbox = $("#lightbox");
  function openLightbox(index) {
    activeIndex = index;
    updateLightbox();
    if (!lightbox.open) lightbox.showModal();
    renderStage();
  }
  function updateLightbox() {
    const photo = getActive();
    $("#lightbox-image").src = photo.src;
    $("#lightbox-image").alt = photo.alt;
    $("#lightbox-title").textContent = photo.title;
    $("#lightbox-location").textContent = `${photo.label} · ${photo.location}`;
    $("#lightbox-description").textContent = photo.description;
  }
  function lightboxStep(amount) {
    step(amount);
    updateLightbox();
  }

  $("#prev-photo").addEventListener("click", () => step(-1));
  $("#next-round").addEventListener("click", () => step(1));
  $("#prev-round").addEventListener("click", () => step(-1));
  $("#open-featured").addEventListener("click", () => openLightbox(activeIndex));
  $$(".stage-card[data-step]").forEach(card => card.addEventListener("click", () => step(Number(card.dataset.step))));
  $("#close-lightbox").addEventListener("click", () => lightbox.close());
  $("#lightbox-prev").addEventListener("click", () => lightboxStep(-1));
  $("#lightbox-next").addEventListener("click", () => lightboxStep(1));
  lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
  document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") lightbox.open ? lightboxStep(1) : step(1);
    if (event.key === "ArrowLeft") lightbox.open ? lightboxStep(-1) : step(-1);
  });

  const filterNav = $("#filters");
  const filterSpacer = filterNav.querySelector(".filter-spacer");
  const filterCount = filterNav.querySelector(".gallery-count");
  const manifestCategories = Array.isArray(window.PHOTOGRAPHY_CATEGORIES) ? window.PHOTOGRAPHY_CATEGORIES : [];
  const categories = [...new Set([...manifestCategories, ...photos.map(photo => photo.category).filter(Boolean)])]
    .sort((a, b) => a.localeCompare(b));

  function categoryLabel(category) {
    const labels = { streetlife: "Street life", street: "Street & life", nature: "Nature", travel: "Travel", details: "Details" };
    return labels[category] || category.replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  }

  function applyFilter(filter, button) {
    $$(".filter-chip", filterNav).forEach(chip => chip.classList.toggle("is-active", chip === button));
    activePhotos = filter === "all" ? [...photos] : photos.filter(photo => photo.category === filter);
    activeIndex = 0;
    renderStage();
    renderGrid();
  }

  // Create one filter per actual folder/category, so new folders appear after rebuilding.
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

  $("#year").textContent = new Date().getFullYear();
  renderStage();
  renderGrid();
})();
