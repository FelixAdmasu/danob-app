<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $categoryImages = [
            'cake-mixes' => '/images/catalog/unique/category-cake-mixes.jpg',
            'chocolate-cocoa' => '/images/catalog/unique/category-chocolate-cocoa.jpg',
            'baking-powders-improvers' => '/images/catalog/unique/category-baking-powders.jpg',
            'yeast-fermentation' => '/images/catalog/unique/category-yeast.jpg',
            'custards-cream-products' => '/images/catalog/unique/category-custards.jpg',
            'gelatin-gelling-products' => '/images/catalog/unique/category-gelatin.jpg',
            'ice-cream-mixes' => '/images/catalog/unique/category-ice-cream.jpg',
            'flavours' => '/images/catalog/unique/category-flavours.jpg',
            'food-colors' => '/images/catalog/unique/category-food-colors.jpg',
            'fondant' => '/images/catalog/unique/category-fondant.jpg',
            'food-sprays' => '/images/catalog/unique/category-food-sprays.jpg',
            'baking-cups' => '/images/catalog/unique/category-baking-cups.jpg',
            'cake-decoration' => '/images/catalog/unique/category-cake-decoration.jpg',
            'cake-tools' => '/images/catalog/unique/category-cake-tools.jpg',
            'cake-molds' => '/images/catalog/unique/category-cake-molds.jpg',
        ];

        foreach ($categoryImages as $slug => $imageUrl) {
            DB::table('categories')->where('slug', $slug)->update(['image_url' => $imageUrl]);
        }

        $brandImages = [
            'bakemate' => '/images/catalog/unique/brand-bakemate.jpg',
            'chocolake' => '/images/catalog/unique/brand-chocolake.jpg',
            'mybake' => '/images/catalog/unique/brand-mybake.jpg',
            'cremio' => '/images/catalog/unique/brand-cremio.jpg',
            'ramco' => '/images/catalog/unique/brand-ramco.jpg',
            'bex' => '/images/catalog/unique/brand-bex.jpg',
        ];

        foreach ($brandImages as $slug => $imageUrl) {
            DB::table('brands')->where('slug', $slug)->update(['logo_url' => $imageUrl]);
        }
    }

    public function down(): void
    {
        // Keep the corrected local paths in place if this migration is rolled back.
    }
};
