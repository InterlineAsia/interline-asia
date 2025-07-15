// public/js/loadPartials.js

document.addEventListener("DOMContentLoaded", function () {
  const loadPartial = (selector, url) => {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`PARTIAL: Skipping ${selector}, not found on this page.`);
      return;
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${url}: ${response.statusText}`);
        }
        return response.text();
      })
      .then((data) => {
        el.innerHTML = data;
        console.log(`PARTIAL: Loaded ${url} into ${selector}`);
      })
      .catch((error) => console.error(`PARTIAL: Error loading ${url}:`, error));
  };

  loadPartial("#header-placeholder", "/partials/header.html");
  loadPartial("#footer-placeholder", "/partials/footer.html");
});