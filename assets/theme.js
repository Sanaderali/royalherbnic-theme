/* Royal Herb theme – small progressive enhancements, no dependencies */
(() => {
  // Mobile menu
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('MobileNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.hidden = open;
    });
  }

  const updateCartCount = async () => {
    try {
      const res = await fetch(window.routes.cart_url + '.js', { headers: { Accept: 'application/json' } });
      const cart = await res.json();
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        el.textContent = cart.item_count;
        el.hidden = cart.item_count === 0;
      });
    } catch (e) { /* ignore */ }
  };

  const ajaxAdd = async (form, messageEl, button) => {
    const original = button ? button.textContent : '';
    if (button) button.disabled = true;
    try {
      const res = await fetch(window.routes.cart_add_url + '.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.description || data.message || 'Error');
      if (messageEl) messageEl.textContent = 'Added to your cart';
      if (button) button.textContent = '✓';
      await updateCartCount();
    } catch (err) {
      if (messageEl) messageEl.textContent = err.message;
    } finally {
      setTimeout(() => { if (button) { button.disabled = false; button.textContent = original; } }, 1400);
    }
  };

  // Quick add on cards
  document.querySelectorAll('form[data-ajax-cart]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      ajaxAdd(form, null, form.querySelector('button[type=submit]'));
    });
  });

  // Product page: gallery + variants + ajax add
  document.querySelectorAll('[data-product]').forEach((root) => {
    const main = root.querySelector('[data-main-media] img');
    root.querySelectorAll('[data-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (!main) return;
        main.removeAttribute('srcset');
        main.src = thumb.dataset.src;
        main.alt = thumb.dataset.alt || '';
        root.querySelectorAll('[data-thumb]').forEach((t) => t.removeAttribute('aria-current'));
        thumb.setAttribute('aria-current', 'true');
      });
    });

    const form = root.querySelector('[data-product-form]');
    if (!form) return;
    const variantsEl = root.querySelector('[data-variants]');
    const variants = variantsEl ? JSON.parse(variantsEl.textContent) : [];
    const idInput = form.querySelector('[data-variant-id]');
    const button = form.querySelector('[data-add-button]');
    const message = form.querySelector('[data-form-message]');
    const priceEl = root.querySelector('[data-price] .price__current');
    const compareEl = root.querySelector('[data-price] .price__compare');
    const format = (cents) => (window.Shopify && Shopify.formatMoney) ? Shopify.formatMoney(cents) :
      new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD' }).format(cents / 100);

    form.querySelectorAll('[data-option-input]').forEach((input) => {
      input.addEventListener('change', () => {
        const selected = [...form.querySelectorAll('fieldset.option')].map((fs) => fs.querySelector('input:checked')?.value);
        const variant = variants.find((v) => v.options.every((o, i) => o === selected[i]));
        if (!variant) { button.disabled = true; button.textContent = 'Unavailable'; return; }
        idInput.value = variant.id;
        button.disabled = !variant.available;
        button.textContent = variant.available ? 'Add to cart' : 'Sold out';
        if (priceEl) priceEl.textContent = format(variant.price);
        if (compareEl) compareEl.textContent = variant.compare_at_price > variant.price ? format(variant.compare_at_price) : '';
        if (variant.featured_image && main) { main.removeAttribute('srcset'); main.src = variant.featured_image.src; }
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      ajaxAdd(form, message, button);
    });
  });
})();
