<?php

namespace App\Mail;

use App\Models\ProductVariant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowStockAlert extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public ProductVariant $variant) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Low Stock: '.$this->variant->product->name.' — '.$this->variant->name);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.low-stock');
    }
}
