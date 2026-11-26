# Royal Herb – Shopify theme

A custom Online Store 2.0 theme for an herbal wellness brand. Original design, no dependencies.

## Structure
- `layout/` – `theme.liquid` and `password.liquid`
- `sections/` – header, footer, hero, benefits, featured collection, collection list, image with text, testimonials, FAQ, newsletter, contact form, plus main page sections
- `templates/` – JSON templates (home, product, collection, cart, search, blog, article, about, contact, FAQ, 404, password)
- `config/settings_schema.json` – brand colors, fonts, logo, layout, social links
- `assets/base.css`, `assets/theme.js`

## Work on it locally
```bash
npm install -g @shopify/cli
shopify theme dev --store tj676b-ub          # live preview, nothing is published
shopify theme check                          # lint
```

## Upload as a NEW unpublished theme
```bash
shopify theme push --unpublished --store tj676b-ub
```
Never run `shopify theme push` against the live theme. Publish only from the Shopify admin once you are happy with it.

## Page templates to assign in Shopify admin
Create pages named **About**, **Contact**, **FAQ** and pick the matching template (`page.about`, `page.contact`, `page.faq`).
