# Catalog card imagery

The public category and trusted-brand cards use local, versioned JPEG assets under `public/images/catalog/`. The database stores the corresponding relative public path in `categories.image_url` or `brands.logo_url`, so images continue to work after Render redeploys.

## Sources and usage

The source imagery was collected from Pexels search and photo pages and downloaded into the repository rather than hotlinked. Pexels states that its photos can be used for free on websites and that attribution is not required, although credit is appreciated:

- [Pexels license](https://www.pexels.com/license/)
- [Baking ingredients on a table — Angela Khebou](https://www.pexels.com/photo/baking-ingredients-on-a-table-13112020/)
- [Ingredients on wooden table — Diana Light](https://www.pexels.com/photo/ingredients-on-wooden-table-10994431/)
- [Pexels baking ingredients search](https://www.pexels.com/search/baking%20ingredients/)
- [Pexels cake decorating search](https://www.pexels.com/search/cake%20decorating/)
- [Pexels ice-cream cake search](https://www.pexels.com/search/ice%20cream%20cake/)

The downloaded images were resized and cropped to the existing card ratio (`4:5`) so their subjects remain legible inside the current design. No brand logos or product packaging are implied by these editorial images; the card title and description remain the source of truth for each brand.

## Mapping

| Content                                                                    | Image path                              |
| -------------------------------------------------------------------------- | --------------------------------------- |
| Cake Mixes, Baking Cups, Flavours, Cake Molds                              | `/images/catalog/cake-mix-tools.jpg`    |
| Chocolate & Cocoa                                                          | `/images/catalog/chocolate-bake.jpg`    |
| Baking Powders & Improvers, Yeast & Fermentation, Gelatin/Gelling Products | `/images/catalog/ingredients-table.jpg` |
| Custards & Cream Products, Ice Cream Mixes                                 | `/images/catalog/ice-cream-cake.jpg`    |
| Food Colors, Fondant, Food Sprays, Cake Decoration                         | `/images/catalog/cake-decoration.jpg`   |
| Cake Tools                                                                 | `/images/catalog/baking-tools.jpg`      |
| BakeMate, Bex, MyBake                                                      | `/images/catalog/ingredients-table.jpg` |
| ChocoLake                                                                  | `/images/catalog/chocolate-bake.jpg`    |
| Cremio                                                                     | `/images/catalog/ice-cream-cake.jpg`    |
| Ramco                                                                      | `/images/catalog/cake-mix-tools.jpg`    |
