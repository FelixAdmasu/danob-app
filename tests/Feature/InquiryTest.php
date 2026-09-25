<?php

namespace Tests\Feature;

use App\Models\Inquiry;
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

    public function test_unverified_users_cannot_access_admin_inquiries(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'staff']);

        $this->actingAs($user)
            ->get(route('admin.inquiries.index'))
            ->assertRedirect(route('verification.notice'));
    }
}
