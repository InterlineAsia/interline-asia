document.addEventListener("DOMContentLoaded", function() {
    const loadPartial = (selector, url) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load ${url}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = data;
                }
            })
            .catch(error => console.error('Error loading partial:', error));
    };

    loadPartial("#header-placeholder", "/partials/header.html");
    loadPartial("#footer-placeholder", "/partials/footer.html");
});