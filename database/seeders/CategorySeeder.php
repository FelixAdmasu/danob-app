<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Cake Mixes', 'slug' => 'cake-mixes', 'description' => 'Pre-mixed formulations for cake preparation.'],
            ['name' => 'Chocolate & Cocoa', 'slug' => 'chocolate-cocoa', 'description' => 'Chocolate products and cocoa powders for baking.'],
            ['name' => 'Baking Powders & Improvers', 'slug' => 'baking-powders-improvers', 'description' => 'Leavening agents and dough improvers.'],
            ['name' => 'Yeast & Fermentation', 'slug' => 'yeast-fermentation', 'description' => 'Yeast products for bread and dough fermentation.'],
            ['name' => 'Custards & Cream Products', 'slug' => 'custards-cream-products', 'description' => 'Custard powders and cream-based products.'],
            ['name' => 'Gelatin/Gelling Products', 'slug' => 'gelatin-gelling-products', 'description' => 'Gelatin powders and gelling agents.'],
            ['name' => 'Ice Cream Mixes', 'slug' => 'ice-cream-mixes', 'description' => 'Pre-mixed formulations for ice cream production.'],
            ['name' => 'Flavours', 'slug' => 'flavours', 'description' => 'Flavouring agents for bakery and pastry products.'],
            ['name' => 'Food Colors', 'slug' => 'food-colors', 'description' => 'Food-grade colouring agents.'],
            ['name' => 'Fondant', 'slug' => 'fondant', 'description' => 'Sugar paste and fondant for cake decoration.'],
            ['name' => 'Food Sprays', 'slug' => 'food-sprays', 'description' => 'Spray-based food products for baking and decoration.'],
            ['name' => 'Baking Cups', 'slug' => 'baking-cups', 'description' => 'Paper and foil cups for baking.'],
            ['name' => 'Cake Decoration', 'slug' => 'cake-decoration', 'description' => 'Decorative products for cakes and pastries.'],
            ['name' => 'Cake Tools', 'slug' => 'cake-tools', 'description' => 'Tools and utensils for cake preparation.'],
            ['name' => 'Cake Molds', 'slug' => 'cake-molds', 'description' => 'Molds for shaping cakes and pastries.'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'is_active' => true,
                ],
            );
        }
    }
}
