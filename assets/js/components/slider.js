/**
 * অটো-স্লাইডিং হিরো ব্যানার। site-config.json এর heroSlides থেকে ডাটা আসে।
 */
function initHeroSlider(containerEl, slides, intervalMs = 5000) {
  if (!containerEl || !slides || slides.length === 0) return;

  containerEl.innerHTML = `
    ${slides
      .map(
        (s, i) => `
      <div class="hero-slide ${i === 0 ? "active" : ""}" style="background-image:url('${s.image}')">
        <div class="container">
          <div class="hero-slide-content">
            <h2>${s.title}</h2>
            <p>${s.subtitle}</p>
            <a href="#about" class="btn btn-primary">বিস্তারিত জানুন</a>
          </div>
        </div>
      </div>`
      )
      .join("")}
    <div class="hero-dots">
      ${slides.map((_, i) => `<button data-index="${i}" class="${i === 0 ? "active" : ""}" aria-label="স্লাইড ${i + 1}"></button>`).join("")}
    </div>
  `;

  const slideEls = containerEl.querySelectorAll(".hero-slide");
  const dotEls = containerEl.querySelectorAll(".hero-dots button");
  let current = 0;
  let timer = null;

  function goTo(index) {
    slideEls[current].classList.remove("active");
    dotEls[current].classList.remove("active");
    current = index;
    slideEls[current].classList.add("active");
    dotEls[current].classList.add("active");
  }

  function next() {
    goTo((current + 1) % slideEls.length);
  }

  function startAuto() {
    timer = setInterval(next, intervalMs);
  }
  function stopAuto() {
    clearInterval(timer);
  }

  dotEls.forEach((dot) => {
    dot.addEventListener("click", () => {
      goTo(Number(dot.dataset.index));
      stopAuto();
      startAuto();
    });
  });

  containerEl.addEventListener("mouseenter", stopAuto);
  containerEl.addEventListener("mouseleave", startAuto);

  startAuto();
}

export { initHeroSlider };
