<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Inquiry;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_inquiry_is_saved_and_notifies_sales_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff']);

        $response = $this->post(route('inquiries.store'), [
            'name' => 'Abebe Bakery',
            'email' => 'buyer@example.com',
            'phone' => '+251911000000',
            'interest' => 'Wholesale Order',
            'message' => 'We need a monthly supply of cake mixes and cocoa.',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('inquiries', [
            'name' => 'Abebe Bakery',
            'email' => 'buyer@example.com',
            'status' => Inquiry::STATUS_NEW,
            'source' => 'website',
        ]);
        $this->assertCount(1, $admin->notifications);
        $this->assertCount(1, $staff->notifications);
        $this->assertSame('inquiry_created', $admin->notifications()->first()->data['type']);
    }

    public function test_honeypot_submission_is_rejected(): void
    {
        $response = $this->post(route('inquiries.store'), [
            'name' => 'Bot',
            'email' => 'bot@example.com',
            'interest' => 'Product Inquiry',
            'message' => 'Automated message should not be accepted.',
            'website' => 'https://spam.example',
        ]);

        $response->assertSessionHasErrors('website');
        $this->assertDatabaseCount('inquiries', 0);
    }

    public function test_product_quote_request_keeps_catalog_context(): void
    {
        $category = Category::create([
            'name' => 'Quote Category',
            'slug' => 'quote-category',
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Bulk Cocoa Powder',
            'slug' => 'bulk-cocoa-powder',
            'description' => 'Wholesale cocoa powder',
            'status' => 'active',
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => '25 kg bag',
            'unit' => 'bag',
            'quantity' => 12,
            'is_active' => true,
        ]);

        $this->post(route('inquiries.store'), [
            'name' => 'Wholesale Buyer',
            'email' => 'buyer@example.com',
            'interest' => 'Wholesale Order',
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'requested_quantity' => 40,
            'message' => 'Please send a quote for forty bags of cocoa powder.',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('inquiries', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'requested_quantity' => 40,
        ]);
    }

    public function test_quote_request_rejects_a_variant_from_another_product(): void
    {
        $category = Category::create([
            'name' => 'Mismatch Category',
            'slug' => 'mismatch-category',
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Product One',
            'slug' => 'product-one',
            'description' => 'Product one',
            'status' => 'active',
        ]);
        $otherProduct = Product::create([
            'category_id' => $category->id,
            'name' => 'Product Two',
            'slug' => 'product-two',
            'description' => 'Product two',
            'status' => 'active',
        ]);
        $variant = ProductVariant::create([
            'product_id' => $otherProduct->id,
            'name' => 'Other option',
            'unit' => 'case',
            'quantity' => 5,
            'is_active' => true,
        ]);

        $this->from(route('home'))
            ->post(route('inquiries.store'), [
                'name' => 'Buyer',
                'email' => 'buyer@example.com',
                'interest' => 'Product Inquiry',
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'message' => 'This should be rejected because the option does not belong to the product.',
            ])
            ->assertSessionHasErrors('variant_id');

        $this->assertDatabaseCount('inquiries', 0);
    }

    public function test_staff_can_review_and_update_an_inquiry(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $inquiry = Inquiry::create([
            'name' => 'Test Buyer',
            'email' => 'test@example.com',
            'interest' => 'Product Inquiry',
            'message' => 'I would like to know if vanilla powder is available.',
            'source' => 'website',
        ]);

        $this->actingAs($staff)
            ->get(route('admin.inquiries.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('inquiries.data', 1));

        $this->actingAs($staff)
            ->patch(route('admin.inquiries.update', $inquiry), [
                'status' => Inquiry::STATUS_CONTACTED,
                'internal_notes' => 'Called the customer and shared the current catalog.',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'status' => Inquiry::STATUS_CONTACTED,
            'assigned_to' => $staff->id,
            'internal_notes' => 'Called the customer and shared the current catalog.',
        ]);
    }

    public function test_non_staff_users_cannot_access_admin_inquiries(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $this->actingAs($user)
            ->get(route('admin.inquiries.index'))
            ->assertForbidden();
    }

    public function test_staff_can_convert_an_inquiry_to_a_customer(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $inquiry = Inquiry::create([
            'name' => 'Sunrise Bakery',
            'email' => 'buyer@sunrise.example',
            'phone' => '+251911111111',
            'interest' => 'Wholesale Order',
            'message' => 'Please open a wholesale customer account for our bakery.',
            'source' => 'website',
        ]);

        $this->actingAs($staff)
            ->post(route('admin.inquiries.convert-to-customer', $inquiry))
            ->assertSessionHas('success');

        $customer = Customer::where('email', 'buyer@sunrise.example')->firstOrFail();
        $this->assertSame('business', $customer->type);
        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'customer_id' => $customer->id,
            'status' => Inquiry::STATUS_CONVERTED,
            'assigned_to' => $staff->id,
        ]);
    }

    public function test_conversion_reuses_an_existing_customer_with_the_same_email(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = Customer::create([
            'type' => 'business',
            'company_name' => 'Existing Bakery',
            'email' => 'existing@example.com',
            'is_active' => true,
        ]);
        $inquiry = Inquiry::create([
            'name' => 'Existing Buyer',
            'email' => 'existing@example.com',
            'interest' => 'Product Inquiry',
            'message' => 'Please send the updated product catalog.',
            'source' => 'website',
        ]);

        $this->actingAs($staff)
            ->post(route('admin.inquiries.convert-to-customer', $inquiry))
            ->assertSessionHas('success');

        $this->assertSame(1, Customer::where('email', 'existing@example.com')->count());
        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'customer_id' => $customer->id,
        ]);
    }
}
