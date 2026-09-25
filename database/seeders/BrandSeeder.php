<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            [
                'name' => 'BakeMate',
                'slug' => 'bakemate',
                'description' => 'Baking ingredients and ice cream mixes.',
                'logo_url' => '/images/catalog/ingredients-table.jpg',
                'is_danob_own' => false,
            ],
            [
                'name' => 'ChocoLake',
                'slug' => 'chocolake',
                'description' => 'Chocolate and cocoa products.',
                'logo_url' => '/images/catalog/chocolate-bake.jpg',
                'is_danob_own' => false,
            ],
            [
                'name' => 'MyBake',
                'slug' => 'mybake',
                'description' => 'Baking ingredients.',
                'logo_url' => '/images/catalog/ingredients-table.jpg',
                'is_danob_own' => false,
            ],
            [
                'name' => 'Cremio',
                'slug' => 'cremio',
                'description' => 'Cream-based products.',
                'logo_url' => '/images/catalog/ice-cream-cake.jpg',
                'is_danob_own' => false,
            ],
            [
                'name' => 'Ramco',
                'slug' => 'ramco',
                'description' => 'Cake mixes and baking products.',
                'logo_url' => '/images/catalog/cake-mix-tools.jpg',
                'is_danob_own' => false,
            ],
            [
                'name' => 'Bex',
                'slug' => 'bex',
                'description' => 'Baking powder and leavening agents.',
                'logo_url' => '/images/catalog/ingredients-table.jpg',
                'is_danob_own' => false,
            ],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['slug' => $brand['slug']],
                [
                    'name' => $brand['name'],
                    'description' => $brand['description'],
                    'logo_url' => $brand['logo_url'],
                    'is_danob_own' => $brand['is_danob_own'],
                    'is_active' => true,
                ],
            );
        }
    }
}
