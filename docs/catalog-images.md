# Catalog card imagery

The public category and trusted-brand cards use local, versioned JPEG assets under `public/images/catalog/unique/`. The database stores the corresponding relative public path in `categories.image_url` or `brands.logo_url`, so images continue to work after Render redeploys.

## Sources and usage

The source imagery was collected from Pexels search and photo pages and downloaded into the repository rather than hotlinked. Pexels states that its photos can be used for free on websites and that attribution is not required, although credit is appreciated:

- [Pexels license](https://www.pexels.com/license/)
- [Pexels baking ingredients search](https://www.pexels.com/search/baking%20ingredients/)
- [Pexels cake decorating search](https://www.pexels.com/search/cake%20decorating/)
- [Pexels ice-cream search](https://www.pexels.com/search/ice%20cream/)
- [Pexels cake search](https://www.pexels.com/search/cake/)
- [Pexels cocoa search](https://www.pexels.com/search/cocoa/)

The downloaded images were resized and cropped to the existing card ratio (`4:5`) so their subjects remain legible inside the current design. No brand logos or product packaging are implied by these editorial images; the card title and description remain the source of truth for each brand.

## Uniqueness rule

Every active category and trusted brand has its own image path. The corrective migration `2026_09_25_000004_use_unique_catalog_card_images.php` replaces the earlier reused assignments in the live database, and the seeders use the same one-to-one mapping for fresh environments.

## Category mapping

| Category                   | Image path                                            |
| -------------------------- | ----------------------------------------------------- |
| Cake Mixes                 | `/images/catalog/unique/category-cake-mixes.jpg`      |
| Chocolate & Cocoa          | `/images/catalog/unique/category-chocolate-cocoa.jpg` |
| Baking Powders & Improvers | `/images/catalog/unique/category-baking-powders.jpg`  |
| Yeast & Fermentation       | `/images/catalog/unique/category-yeast.jpg`           |
| Custards & Cream Products  | `/images/catalog/unique/category-custards.jpg`        |
| Gelatin/Gelling Products   | `/images/catalog/unique/category-gelatin.jpg`         |
| Ice Cream Mixes            | `/images/catalog/unique/category-ice-cream.jpg`       |
| Flavours                   | `/images/catalog/unique/category-flavours.jpg`        |
| Food Colors                | `/images/catalog/unique/category-food-colors.jpg`     |
| Fondant                    | `/images/catalog/unique/category-fondant.jpg`         |
| Food Sprays                | `/images/catalog/unique/category-food-sprays.jpg`     |
| Baking Cups                | `/images/catalog/unique/category-baking-cups.jpg`     |
| Cake Decoration            | `/images/catalog/unique/category-cake-decoration.jpg` |
| Cake Tools                 | `/images/catalog/unique/category-cake-tools.jpg`      |
| Cake Molds                 | `/images/catalog/unique/category-cake-molds.jpg`      |

## Trusted-brand mapping

| Brand     | Image path                                   |
| --------- | -------------------------------------------- |
| BakeMate  | `/images/catalog/unique/brand-bakemate.jpg`  |
| ChocoLake | `/images/catalog/unique/brand-chocolake.jpg` |
| MyBake    | `/images/catalog/unique/brand-mybake.jpg`    |
| Cremio    | `/images/catalog/unique/brand-cremio.jpg`    |
| Ramco     | `/images/catalog/unique/brand-ramco.jpg`     |
| Bex       | `/images/catalog/unique/brand-bex.jpg`       |
