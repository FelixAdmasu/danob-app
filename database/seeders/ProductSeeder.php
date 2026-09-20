<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Gelatine Powder', 'slug' => 'gelatine-powder', 'category' => 'gelatin-gelling-products', 'brand' => null, 'description' => 'Powdered gelatin for baking and pastry applications.'],
            ['name' => 'Pure Baking Soda', 'slug' => 'pure-baking-soda', 'category' => 'baking-powders-improvers', 'brand' => null, 'description' => 'Pure sodium bicarbonate for baking.'],
            ['name' => 'Bex Baking Powder', 'slug' => 'bex-baking-powder', 'category' => 'baking-powders-improvers', 'brand' => 'bex', 'description' => 'Double-acting baking powder.'],
            ['name' => 'Neo Vanilla Powder', 'slug' => 'neo-vanilla-powder', 'category' => 'flavours', 'brand' => null, 'description' => 'Vanilla-flavoured powder for bakery use.'],
            ['name' => 'Vanilla Ice Cream Mix', 'slug' => 'vanilla-ice-cream-mix', 'category' => 'ice-cream-mixes', 'brand' => 'bakemate', 'description' => 'Pre-mixed vanilla ice cream base.'],
            ['name' => 'Ramco White Cake Mix', 'slug' => 'ramco-white-cake-mix', 'category' => 'cake-mixes', 'brand' => 'ramco', 'description' => 'White cake mix for sponge cakes.'],
            ['name' => 'Ramco Chocolate Mix', 'slug' => 'ramco-chocolate-mix', 'category' => 'cake-mixes', 'brand' => 'ramco', 'description' => 'Chocolate-flavoured cake mix.'],
            ['name' => 'Dough Hammer Soft', 'slug' => 'dough-hammer-soft', 'category' => 'baking-powders-improvers', 'brand' => null, 'description' => 'Dough conditioner for soft bread texture.'],
            ['name' => 'Potassium Sorbate', 'slug' => 'potassium-sorbate', 'category' => 'baking-powders-improvers', 'brand' => null, 'description' => 'Food preservative for bakery products.'],
            ['name' => 'Cream Shantille', 'slug' => 'cream-shantille', 'category' => 'custards-cream-products', 'brand' => 'cremio', 'description' => 'Whipping cream powder for decoration and filling.'],
            ['name' => 'Custard', 'slug' => 'custard', 'category' => 'custards-cream-products', 'brand' => null, 'description' => 'Custard powder for desserts and fillings.'],
            ['name' => 'Super Gato', 'slug' => 'super-gato', 'category' => 'cake-mixes', 'brand' => null, 'description' => 'Cake mix product.'],
            ['name' => 'Corn Starch', 'slug' => 'corn-starch', 'category' => 'baking-powders-improvers', 'brand' => null, 'description' => 'Corn starch for baking and thickening.'],
            ['name' => 'Instant Dry Yeast', 'slug' => 'instant-dry-yeast', 'category' => 'yeast-fermentation', 'brand' => null, 'description' => 'Instant dry yeast for bread and dough.'],
            ['name' => 'BakeMate Vanilla Ice Cream', 'slug' => 'bakemate-vanilla-ice-cream', 'category' => 'ice-cream-mixes', 'brand' => 'bakemate', 'description' => 'Vanilla ice cream mix by BakeMate.'],
        ];

        $this->seedBatch($products);
    }

    private function seedBatch(array $products): void
    {
        foreach ($products as $data) {
            $categoryId = Category::where('slug', $data['category'])->first()?->id;
            $brandId = $data['brand'] ? Brand::where('slug', $data['brand'])->first()?->id : null;

            if (! $categoryId) {
                continue;
            }

            Product::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'category_id' => $categoryId,
                    'brand_id' => $brandId,
                    'description' => $data['description'],
                    'status' => 'active',
                ],
            );
        }
    }
}
