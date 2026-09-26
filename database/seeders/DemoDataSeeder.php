<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedVariants();
        $this->seedCustomers();
        $this->seedSuppliers();
    }

    private function seedVariants(): void
    {
        $units = ['1 kg bag', '5 kg bag', '25 kg bag'];
        $products = Product::query()->orderBy('id')->get();

        foreach ($products as $index => $product) {
            foreach ($units as $unitIndex => $unit) {
                $quantity = 12 + (($index * 7 + $unitIndex * 11) % 80);
                $sku = 'DEMO-'.str_pad((string) $product->id, 3, '0', STR_PAD_LEFT).'-'.($unitIndex + 1);

                ProductVariant::updateOrCreate(
                    ['sku' => $sku],
                    [
                        'product_id' => $product->id,
                        'name' => $unit,
                        'unit' => 'unit',
                        'quantity' => $quantity,
                        'low_stock_threshold' => 10,
                        'public_price' => 150 + ($index * 23) + ($unitIndex * 275),
                        'is_active' => true,
                    ],
                );
            }
        }
    }

    private function seedCustomers(): void
    {
        $customers = [
            ['type' => 'business', 'company_name' => 'Sunrise Bakery', 'contact_name' => 'Marta Bekele', 'email' => 'demo.sunrise@example.test', 'phone' => '+251911000101'],
            ['type' => 'business', 'company_name' => 'Addis Cake House', 'contact_name' => 'Dawit Alemu', 'email' => 'demo.addiscake@example.test', 'phone' => '+251911000102'],
            ['type' => 'home_business', 'company_name' => 'Mimi Pastry Studio', 'contact_name' => 'Mimi Tadesse', 'email' => 'demo.mimi@example.test', 'phone' => '+251911000103'],
            ['type' => 'individual', 'company_name' => null, 'contact_name' => 'Samuel Girma', 'email' => 'demo.samuel@example.test', 'phone' => '+251911000104'],
            ['type' => 'business', 'company_name' => 'Blue Nile Café', 'contact_name' => 'Hana Worku', 'email' => 'demo.bluenile@example.test', 'phone' => '+251911000105'],
            ['type' => 'other', 'company_name' => 'Community Baking School', 'contact_name' => 'Kebede Tesfaye', 'email' => 'demo.school@example.test', 'phone' => '+251911000106'],
        ];

        foreach ($customers as $customer) {
            Customer::updateOrCreate(
                ['email' => $customer['email']],
                $customer + ['is_active' => true, 'notes' => 'Opt-in Danob demo record.'],
            );
        }
    }

    private function seedSuppliers(): void
    {
        $suppliers = [
            ['name' => 'Demo Ingredients Trading', 'contact_person' => 'Abel Kassa', 'email' => 'demo.ingredients@example.test', 'phone' => '+251911000201'],
            ['name' => 'Addis Packaging Supply', 'contact_person' => 'Rahel Mengistu', 'email' => 'demo.packaging@example.test', 'phone' => '+251911000202'],
            ['name' => 'East Africa Food Imports', 'contact_person' => 'Yonas Fikru', 'email' => 'demo.imports@example.test', 'phone' => '+251911000203'],
            ['name' => 'Bole Cold Chain Demo', 'contact_person' => 'Selamawit Hailu', 'email' => 'demo.coldchain@example.test', 'phone' => '+251911000204'],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::updateOrCreate(
                ['email' => $supplier['email']],
                $supplier + ['is_active' => true, 'notes' => 'Opt-in Danob demo record.'],
            );
        }
    }
}
