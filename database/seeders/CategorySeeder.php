<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Cake Mixes', 'slug' => 'cake-mixes', 'description' => 'Pre-mixed formulations for cake preparation.', 'image_url' => '/images/catalog/unique/category-cake-mixes.jpg'],
            ['name' => 'Chocolate & Cocoa', 'slug' => 'chocolate-cocoa', 'description' => 'Chocolate products and cocoa powders for baking.', 'image_url' => '/images/catalog/unique/category-chocolate-cocoa.jpg'],
            ['name' => 'Baking Powders & Improvers', 'slug' => 'baking-powders-improvers', 'description' => 'Leavening agents and dough improvers.', 'image_url' => '/images/catalog/unique/category-baking-powders.jpg'],
            ['name' => 'Yeast & Fermentation', 'slug' => 'yeast-fermentation', 'description' => 'Yeast products for bread and dough fermentation.', 'image_url' => '/images/catalog/unique/category-yeast.jpg'],
            ['name' => 'Custards & Cream Products', 'slug' => 'custards-cream-products', 'description' => 'Custard powders and cream-based products.', 'image_url' => '/images/catalog/unique/category-custards.jpg'],
            ['name' => 'Gelatin/Gelling Products', 'slug' => 'gelatin-gelling-products', 'description' => 'Gelatin powders and gelling agents.', 'image_url' => '/images/catalog/unique/category-gelatin.jpg'],
            ['name' => 'Ice Cream Mixes', 'slug' => 'ice-cream-mixes', 'description' => 'Pre-mixed formulations for ice cream production.', 'image_url' => '/images/catalog/unique/category-ice-cream.jpg'],
            ['name' => 'Flavours', 'slug' => 'flavours', 'description' => 'Flavouring agents for bakery and pastry products.', 'image_url' => '/images/catalog/unique/category-flavours.jpg'],
            ['name' => 'Food Colors', 'slug' => 'food-colors', 'description' => 'Food-grade colouring agents.', 'image_url' => '/images/catalog/unique/category-food-colors.jpg'],
            ['name' => 'Fondant', 'slug' => 'fondant', 'description' => 'Sugar paste and fondant for cake decoration.', 'image_url' => '/images/catalog/unique/category-fondant.jpg'],
            ['name' => 'Food Sprays', 'slug' => 'food-sprays', 'description' => 'Spray-based food products for baking and decoration.', 'image_url' => '/images/catalog/unique/category-food-sprays.jpg'],
            ['name' => 'Baking Cups', 'slug' => 'baking-cups', 'description' => 'Paper and foil cups for baking.', 'image_url' => '/images/catalog/unique/category-baking-cups.jpg'],
            ['name' => 'Cake Decoration', 'slug' => 'cake-decoration', 'description' => 'Decorative products for cakes and pastries.', 'image_url' => '/images/catalog/unique/category-cake-decoration.jpg'],
            ['name' => 'Cake Tools', 'slug' => 'cake-tools', 'description' => 'Tools and utensils for cake preparation.', 'image_url' => '/images/catalog/unique/category-cake-tools.jpg'],
            ['name' => 'Cake Molds', 'slug' => 'cake-molds', 'description' => 'Molds for shaping cakes and pastries.', 'image_url' => '/images/catalog/unique/category-cake-molds.jpg'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'image_url' => $category['image_url'],
                    'is_active' => true,
                ],
            );
        }
    }
}
