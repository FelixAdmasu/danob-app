<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Kolfe Keranio',
                'address' => 'Kolfe Keranio area',
                'city' => 'Addis Ababa',
                'is_active' => true,
            ],
            [
                'name' => 'Nifas Silk-Lafto',
                'address' => 'Nifas Silk-Lafto area',
                'city' => 'Addis Ababa',
                'is_active' => true,
            ],
            [
                'name' => 'Yeka',
                'address' => 'Yeka area',
                'city' => 'Addis Ababa',
                'is_active' => true,
            ],
        ];

        foreach ($branches as $branch) {
            Branch::updateOrCreate(
                ['name' => $branch['name']],
                [
                    'address' => $branch['address'],
                    'city' => $branch['city'],
                    'is_active' => $branch['is_active'],
                ],
            );
        }
    }
}
