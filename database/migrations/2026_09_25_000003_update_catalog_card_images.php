<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $categoryImages = [
            'cake-mixes' => '/images/catalog/cake-mix-tools.jpg',
            'chocolate-cocoa' => '/images/catalog/chocolate-bake.jpg',
            'baking-powders-improvers' => '/images/catalog/ingredients-table.jpg',
            'yeast-fermentation' => '/images/catalog/ingredients-table.jpg',
            'custards-cream-products' => '/images/catalog/ice-cream-cake.jpg',
            'gelatin-gelling-products' => '/images/catalog/ingredients-table.jpg',
            'ice-cream-mixes' => '/images/catalog/ice-cream-cake.jpg',
            'flavours' => '/images/catalog/cake-mix-tools.jpg',
            'food-colors' => '/images/catalog/cake-decoration.jpg',
            'fondant' => '/images/catalog/cake-decoration.jpg',
            'food-sprays' => '/images/catalog/cake-decoration.jpg',
            'baking-cups' => '/images/catalog/cake-mix-tools.jpg',
            'cake-decoration' => '/images/catalog/cake-decoration.jpg',
            'cake-tools' => '/images/catalog/baking-tools.jpg',
            'cake-molds' => '/images/catalog/cake-mix-tools.jpg',
        ];

        foreach ($categoryImages as $slug => $imageUrl) {
            DB::table('categories')->where('slug', $slug)->update(['image_url' => $imageUrl]);
        }

        $brandImages = [
            'bakemate' => '/images/catalog/ingredients-table.jpg',
            'chocolake' => '/images/catalog/chocolate-bake.jpg',
            'mybake' => '/images/catalog/ingredients-table.jpg',
            'cremio' => '/images/catalog/ice-cream-cake.jpg',
            'ramco' => '/images/catalog/cake-mix-tools.jpg',
            'bex' => '/images/catalog/ingredients-table.jpg',
        ];

        foreach ($brandImages as $slug => $logoUrl) {
            DB::table('brands')->where('slug', $slug)->update(['logo_url' => $logoUrl]);
        }
    }

    public function down(): void
    {
        // This data migration intentionally does not remove previous image URLs.
        // The admin image controls can replace or remove a card image explicitly.
    }
};
