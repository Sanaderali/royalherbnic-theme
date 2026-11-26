/* Royal Herb theme — vanilla JS, no dependencies */
(() => {
  const theme = window.theme || { routes: {}, strings: {} };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const overlay = $('[data-overlay]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Money ---------- */
  const formatMoney = (cents) => {
    const fmt = theme.moneyFormat || '${{amount}}';
    const n = (Number(cents) / 100);
    const withDelims = (num, dec, thou = ',', d = '.') => {
      const [i, f] = num.toFixed(dec).split('.');
      return i.replace(/\B(?=(\d{3})+(?!\d))/g, thou) + (f ? d + f : '');
    };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) => ({
      amount: withDelims(n, 2), amount_no_decimals: withDelims(n, 0),
      amount_with_comma_separator: withDelims(n, 2, '.', ','), amount_no_decimals_with_comma_separator: withDelims(n, 0, '.', ',')
    }[k] ?? withDelims(n, 2)));
  };

  /* ---------- Panels (drawers, mobile nav, filters) ---------- */
  let openPanel = null;
  const showPanel = (el) => {
    if (!el) return;
    if (openPanel && openPanel !== el) hidePanel(openPanel);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    if (overlay) { overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('is-visible')); }
    document.body.classList.add('is-locked');
    openPanel = el;
    const focusable = el.querySelector('input, button, a');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 300);
  };
  const hidePanel = (el = openPanel) => {
    if (!el) return;
    el.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    document.body.classList.remove('is-locked');
    setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; if (overlay && !openPanel) overlay.hidden = true; }, 450);
    openPanel = null;
    const toggle = $('[data-menu-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  };
  overlay?.addEventListener('click', () => hidePanel());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hidePanel(); closeSearchResults(); closeLang(); } });

  /* ---------- Header ---------- */
  const header = $('[data-header]');
  const setHeaderHeight = () => { if (header) document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px'); };
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);
  if (header?.hasAttribute('data-transparent')) document.body.classList.add('has-transparent-header');
  const onScroll = () => header?.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuToggle = $('[data-menu-toggle]');
  const mobileNav = $('#MobileNav');
  menuToggle?.addEventListener('click', () => { menuToggle.setAttribute('aria-expanded', 'true'); showPanel(mobileNav); });
  $$('[data-menu-close]').forEach((b) => b.addEventListener('click', () => hidePanel()));

  /* ---------- Language switcher ---------- */
  const langToggle = $('[data-lang-toggle]');
  const langList = $('#LangList');
  const closeLang = () => { if (langList) { langList.hidden = true; langToggle?.setAttribute('aria-expanded', 'false'); } };
  langToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = langToggle.getAttribute('aria-expanded') === 'true';
    langToggle.setAttribute('aria-expanded', String(!open));
    langList.hidden = open;
  });
  document.addEventListener('click', (e) => { if (langList && !e.target.closest('.lang')) closeLang(); });
  $$('[data-lang-code]').forEach((btn) => btn.addEventListener('click', () => {
    const form = $('#HeaderLanguageForm');
    if (!form) return;
    form.querySelector('[data-lang-input]').value = btn.dataset.langCode;
    form.submit();
  }));

  /* ---------- Announcement rotation ---------- */
  $$('[data-announcement]').forEach((bar) => {
    const items = $$('.announcement__item', bar);
    if (items.length < 2 || reduceMotion) return;
    let i = 0;
    setInterval(() => { items[i].classList.remove('is-active'); i = (i + 1) % items.length; items[i].classList.add('is-active'); }, 5000);
  });

  /* ---------- Predictive search (header pill) ---------- */
  const searchForm = $('[data-header-search]');
  const searchInput = searchForm ? $('[data-predictive-input]', searchForm) : null;
  const searchResults = searchForm ? $('[data-predictive-results]', searchForm) : null;
  const closeSearchResults = () => { if (searchResults) searchResults.hidden = true; };
  let searchTimer, searchController;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) { closeSearchResults(); return; }
    searchTimer = setTimeout(async () => {
      searchController?.abort();
      searchController = new AbortController();
      try {
        const url = `${theme.routes.predictive_search_url}?q=${encodeURIComponent(q)}&section_id=predictive-search&resources[type]=product,collection,query&resources[limit]=6`;
        const res = await fetch(url, { signal: searchController.signal });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const content = doc.querySelector('.predictive');
        searchResults.innerHTML = content ? content.outerHTML : '';
        searchResults.hidden = !content;
      } catch (e) { /* aborted */ }
    }, 220);
  });
  searchInput?.addEventListener('focus', () => { if (searchResults?.innerHTML.trim()) searchResults.hidden = false; });
  document.addEventListener('click', (e) => { if (searchForm && !searchForm.contains(e.target)) closeSearchResults(); });

  /* ---------- Cart ---------- */
  const cartDrawer = () => $('[data-cart-drawer]');
  const updateCount = (count) => $$('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });

  const refreshCart = async (open = false) => {
    try {
      const [sectionsRes, cartRes] = await Promise.all([
        theme.cartType === 'drawer' ? fetch(`${theme.routes.root}?sections=cart-drawer`) : Promise.resolve(null),
        fetch(`${theme.routes.cart_url}.js`, { headers: { Accept: 'application/json' } })
      ]);
      const cart = await cartRes.json();
      updateCount(cart.item_count);
      if (sectionsRes) {
        const data = await sectionsRes.json();
        const doc = new DOMParser().parseFromString(data['cart-drawer'], 'text/html');
        const fresh = doc.querySelector('[data-cart-drawer]');
        const current = cartDrawer();
        if (fresh && current) {
          current.innerHTML = fresh.innerHTML;
          bindCartDrawer();
        }
        if (open) showPanel(cartDrawer());
      }
    } catch (e) { console.error(e); }
  };

  const bindCartDrawer = () => {
    const drawer = cartDrawer();
    if (!drawer) return;
    $$('[data-close-drawer]', drawer).forEach((b) => b.addEventListener('click', () => hidePanel()));
    $$('[data-cart-change]', drawer).forEach((b) => b.addEventListener('click', async () => {
      drawer.classList.add('is-loading');
      await fetch(`${theme.routes.cart_change_url}.js`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: b.dataset.cartChange, quantity: Number(b.dataset.qty) })
      });
      drawer.classList.remove('is-loading');
      refreshCart();
    }));
    bindAjaxForms(drawer);
  };

  const addToCart = async (form, button, messageEl) => {
    const label = button?.querySelector('[data-add-label]') || button;
    const original = label?.textContent;
    if (button) button.disabled = true;
    try {
      const res = await fetch(`${theme.routes.cart_add_url}.js`, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.description || data.message || 'Error');
      if (theme.cartType === 'drawer') {
        await refreshCart(true);
      } else {
        if (label) label.textContent = theme.strings.added || 'Added';
        refreshCart();
      }
      if (messageEl) messageEl.textContent = '';
    } catch (err) {
      if (messageEl) messageEl.textContent = err.message; else alert(err.message);
    } finally {
      setTimeout(() => { if (button) button.disabled = false; if (label && original) label.textContent = original; }, 1200);
    }
  };

  const bindAjaxForms = (root = document) => {
    $$('form[data-ajax-cart]', root).forEach((form) => {
      if (form.dataset.bound) return;
      form.dataset.bound = '1';
      form.addEventListener('submit', (e) => { e.preventDefault(); addToCart(form, form.querySelector('[type=submit]')); });
    });
  };
  bindAjaxForms();
  bindCartDrawer();

  if (theme.cartType === 'drawer') {
    $$('[data-open-cart]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); showPanel(cartDrawer()); }));
  }

  /* ---------- Reveal on scroll + counters ---------- */
  const animateCount = (el) => {
    const raw = el.dataset.count;
    const target = parseFloat(raw);
    if (isNaN(target) || reduceMotion) return;
    const suffix = el.textContent.replace(raw, '');
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / 1600, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && document.body.classList.contains('has-animations')) {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      $$('[data-count]', entry.target).forEach(animateCount);
      io.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Tabs ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[data-tab]', root);
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.setAttribute('aria-selected', 'false'); const p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = true; });
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) { panel.hidden = false; $$('.reveal', panel).forEach((el) => el.classList.add('is-visible')); }
    }));
  });

  /* ---------- Carousel ---------- */
  $$('[data-carousel]').forEach((root) => {
    const track = $('[data-carousel-track]', root);
    if (!track) return;
    const rtl = document.dir === 'rtl' ? -1 : 1;
    const amount = () => (track.firstElementChild?.offsetWidth || 300) + 24;
    $('[data-carousel-prev]', root)?.addEventListener('click', () => track.scrollBy({ left: -amount() * rtl }));
    $('[data-carousel-next]', root)?.addEventListener('click', () => track.scrollBy({ left: amount() * rtl }));
  });

  /* ---------- Video ---------- */
  $$('[data-video]').forEach((root) => {
    $('[data-video-play]', root)?.addEventListener('click', () => {
      const tpl = $('[data-video-template]', root);
      if (tpl) root.appendChild(tpl.content.cloneNode(true));
      $('.video__poster', root)?.remove();
    });
  });

  /* ---------- Product page ---------- */
  $$('[data-product]').forEach((root) => {
    const mainWrap = $('[data-main-media]', root);
    const main = mainWrap ? $('img', mainWrap) : null;
    const setMain = (src, alt) => { if (!main || !src) return; main.removeAttribute('srcset'); main.src = src; if (alt !== undefined) main.alt = alt; };

    $$('[data-thumb]', root).forEach((thumb) => thumb.addEventListener('click', () => {
      setMain(thumb.dataset.src, thumb.dataset.alt);
      $$('[data-thumb]', root).forEach((t) => t.removeAttribute('aria-current'));
      thumb.setAttribute('aria-current', 'true');
    }));

    // Hover zoom (desktop)
    if (mainWrap && main && window.matchMedia('(hover: hover)').matches) {
      mainWrap.addEventListener('mousemove', (e) => {
        const r = mainWrap.getBoundingClientRect();
        main.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
        main.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      mainWrap.addEventListener('mouseenter', () => mainWrap.classList.add('is-zoomed'));
      mainWrap.addEventListener('mouseleave', () => mainWrap.classList.remove('is-zoomed'));
    }

    const form = $('[data-product-form]', root);
    if (!form) return;
    const variants = JSON.parse($('[data-variants]', root)?.textContent || '[]');
    const idInput = $('[data-variant-id]', form);
    const button = $('[data-add-button]', form);
    const addLabel = $('[data-add-label]', form);
    const addPrice = $('[data-add-price]', form);
    const message = $('[data-form-message]', form);
    const priceEl = $('[data-price] .price__current', root);
    const compareEl = $('[data-price] .price__compare', root);
    const stickyPrice = $('[data-sticky-price]', root);
    const stickyBtn = $('[data-sticky-button]', root);

    // Quantity stepper
    const qty = $('[data-qty-input]', form);
    $('[data-qty-minus]', form)?.addEventListener('click', () => { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); });
    $('[data-qty-plus]', form)?.addEventListener('click', () => { qty.value = (parseInt(qty.value, 10) || 1) + 1; });

    $$('[data-option-input]', form).forEach((input) => input.addEventListener('change', () => {
      const fieldsets = $$('fieldset.option', form);
      const selected = fieldsets.map((fs) => fs.querySelector('input:checked')?.value);
      fieldsets.forEach((fs, i) => { const s = $('[data-option-selected]', fs); if (s) s.textContent = selected[i]; });
      const variant = variants.find((v) => v.options.every((o, i) => o === selected[i]));
      if (!variant) {
        button.disabled = true; if (addLabel) addLabel.textContent = theme.strings.unavailable;
        if (stickyBtn) stickyBtn.disabled = true;
        return;
      }
      idInput.value = variant.id;
      button.disabled = !variant.available;
      if (stickyBtn) stickyBtn.disabled = !variant.available;
      if (addLabel) addLabel.textContent = variant.available ? theme.strings.addToCart : theme.strings.soldOut;
      if (addPrice) addPrice.textContent = formatMoney(variant.price);
      if (priceEl) priceEl.textContent = formatMoney(variant.price);
      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);
      if (compareEl) compareEl.textContent = variant.compare_at_price > variant.price ? formatMoney(variant.compare_at_price) : '';
      if (variant.featured_media) {
        const thumb = $(`[data-thumb][data-media-id="${variant.featured_media.id}"]`, root);
        if (thumb) thumb.click(); else if (variant.featured_image) setMain(variant.featured_image.src);
      }
      form.dispatchEvent(new CustomEvent('variant:change', { detail: { price: variant.price, variant } }));
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    }));

    form.addEventListener('submit', (e) => { e.preventDefault(); addToCart(form, button, message); });

    // Sticky add-to-cart bar
    const sticky = $('[data-sticky-atc]', root);
    if (sticky && 'IntersectionObserver' in window) {
      sticky.hidden = false;
      new IntersectionObserver(([entry]) => {
        sticky.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      }).observe(button);
    }
  });


  /* ---------- Bundle offer ---------- */
  $$('[data-bundle]').forEach((bundle) => {
    const form = document.getElementById(bundle.dataset.formId);
    const qtyInput = form?.querySelector('[data-qty-input]');
    const sync = () => {
      const picked = bundle.querySelector('input:checked');
      if (picked && qtyInput) qtyInput.value = picked.dataset.bundleQty;
    };
    bundle.addEventListener('change', sync);
    sync();
    // Re-price tiers when the variant changes
    form?.addEventListener('variant:change', (e) => {
      const price = e.detail.price;
      $$('.bundle__tier', bundle).forEach((tier) => {
        const input = tier.querySelector('input');
        const qty = Number(input.dataset.bundleQty), disc = Number(input.dataset.bundleDiscount);
        const full = price * qty, pay = Math.round(full * (100 - disc) / 100);
        const p = tier.querySelector('[data-bundle-price]'); if (p) p.textContent = formatMoney(pay);
        const c = tier.querySelector('[data-bundle-compare]'); if (c) c.textContent = formatMoney(full);
        const l = tier.querySelector('[data-bundle-label]'); if (l) l.textContent = l.dataset.template.replace('[save]', formatMoney(full - pay));
      });
    });
  });

  /* ---------- Product recommendations ---------- */
  $$('[data-recommendations]').forEach(async (el) => {
    try {
      const res = await fetch(el.dataset.url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = doc.querySelector('[data-recommendations]');
      if (fresh && fresh.innerHTML.trim()) { el.innerHTML = fresh.innerHTML; bindAjaxForms(el); }
    } catch (e) { /* ignore */ }
  });

  /* ---------- Collection filters ---------- */
  const filters = $('[data-filters]');
  $$('[data-open-filters]').forEach((b) => b.addEventListener('click', () => showPanel(filters)));
  $$('[data-close-filters]').forEach((b) => b.addEventListener('click', () => hidePanel()));
  $$('[data-auto-submit]').forEach((input) => input.addEventListener('change', () => input.form?.submit()));
})();
