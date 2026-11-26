# Royal Herb – Shopify theme

A premium Online Store 2.0 theme for an herbal wellness brand ("luxury apothecary" look). Vanilla JS, no dependencies. English (default) + Urdu with full right-to-left support.

## Highlights
- Header: logo, pill search bar with live product suggestions, language switcher (English / اردو), cart and account buttons, category row with dropdowns and mega menus
- Slide-out cart with free-shipping progress bar and "pairs well with" suggestions
- Home sections: editorial hero (arch image, floating product, rotating badge) or full-width image/video hero, scrolling text, shop by concern, statement text, ingredients, image with text + animated stats, process steps, video, comparison table, reviews carousel, press logos, trust icons, photo gallery, newsletter
- Product page: hover zoom gallery, highlights, badges, quantity stepper, add to cart with price, trust icons, accordions, sticky add-to-cart bar, related products
- Collection page: banner, filter sidebar (drawer on mobile), active filter chips, sort
- Scroll reveal animations, paper grain texture (both can be turned off in Theme settings)

## Work on it locally (VS Code)
```bash
npm install -g @shopify/cli
git clone https://github.com/Sanaderali/royalherbnic-theme && cd royalherbnic-theme
shopify theme dev --store tj676b-ub     # live preview at http://127.0.0.1:9292
shopify theme check                     # lint
shopify theme push --unpublished --store tj676b-ub
```

## Urdu (second language)
1. Shopify admin → Settings → Languages → Add language → Urdu → Publish.
2. Theme text (buttons, cart, search…) is already translated in `locales/ur.json`.
3. Translate your products, collections and section text with the free **Translate & Adapt** app.
4. The language switcher appears in the header automatically, and Urdu pages render right-to-left with the Noto Nastaliq Urdu font.

## Menus
- Main menu: top-level items become the category row. Give an item sub-links for a dropdown, or 3 levels of links for a full mega menu.
- Create pages **About**, **Contact**, **FAQ** and assign the `page.about`, `page.contact`, `page.faq` templates.
