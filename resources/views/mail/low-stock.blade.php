<x-mail::message>
# Low Stock Alert

Product: {{ $variant->product->name }} — {{ $variant->name }}

Quantity: {{ $variant->quantity }} (threshold 5)

SKU: {{ $variant->sku ?? '—' }}

Please restock soon.

<x-mail::button :url="url('/admin/products/'.$variant->product_id.'/edit')">
View Product
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
