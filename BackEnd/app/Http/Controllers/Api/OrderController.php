<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreOrderRequest;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\SellerOrder;
use App\Models\ShippingMethod;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(private readonly CheckoutController $checkout)
    {
    }

    /**
     * The signed-in shopper's own orders, newest first. Backs purchases.html.
     *
     * Scoped to `user_id` rather than filtered afterwards: an order belongs
     * to whoever placed it, and nobody else has any business reading it.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', 'in:' . implode(',', [
                Order::STATUS_PENDING,
                Order::STATUS_PROCESSING,
                Order::STATUS_SHIPPED,
                Order::STATUS_COMPLETED,
                Order::STATUS_CANCELLED,
            ])],
        ]);

        $query = Order::with([
            'sellerOrders.store',
            'sellerOrders.shippingMethod',
            'sellerOrders.items.product.images',
            'payment.method',
        ])->where('user_id', $request->user()->id);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $orders = $query->orderByDesc('id')
            ->get()
            ->map(fn (Order $order) => $this->orderPayload($order))
            ->all();

        return response()->json([
            'orders' => $orders,

            // Counted over every order, not the filtered ones: the tabs have
            // to keep showing what is behind them.
            'summary' => $this->summary($request->user()->id),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'placed_at' => $order->created_at?->toIso8601String(),

            'subtotal' => $order->subtotal,
            'discount_amount' => $order->discount_amount,
            'shipping_fee' => $order->shipping_fee,
            'service_fee' => $order->service_fee,
            'total_amount' => $order->total_amount,

            'shipping' => [
                'recipient_name' => $order->shipping_recipient_name,
                'phone' => $order->shipping_phone,
                'address' => $order->shipping_address,
                'city' => $order->shipping_city,
                'province' => $order->shipping_province,
                'postal_code' => $order->shipping_postal_code,
            ],

            // Schema.md keeps payment state out of `orders.status`, so it is
            // reported on its own here too.
            'payment' => $order->payment ? [
                'method' => $order->payment->method?->name,
                'status' => $order->payment->status,
                'amount' => $order->payment->amount,
                'paid_at' => $order->payment->paid_at?->toIso8601String(),
            ] : null,

            'stores' => $order->sellerOrders
                ->map(fn (SellerOrder $sellerOrder) => [
                    'id' => $sellerOrder->id,
                    'store' => $sellerOrder->store?->name,
                    'status' => $sellerOrder->status,
                    'shipping_method' => $sellerOrder->shippingMethod?->name,
                    'subtotal' => $sellerOrder->subtotal,
                    'shipping_fee' => $sellerOrder->shipping_fee,
                    'total_amount' => $sellerOrder->total_amount,

                    'items' => $sellerOrder->items
                        ->map(fn (OrderItem $item) => [
                            'id' => $item->id,

                            /* The stored copies, not the product's current
                               values: a rename or a reprice must not rewrite
                               what this receipt says was bought. */
                            'name' => $item->product_name,
                            'sku' => $item->sku,
                            'unit_price' => $item->unit_price,
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,

                            // The picture and the link back are the only
                            // things read live, and both may be gone.
                            'product_id' => $item->product_id,
                            'image' => $item->product?->primaryImage()?->url(),
                            'still_listed' => $item->product !== null
                                && $item->product->deleted_at === null,
                        ])
                        ->all(),
                ])
                ->all(),
        ];
    }

    /**
     * How many orders sit in each status, for the tabs above the list.
     *
     * @return array<string, int>
     */
    private function summary(int $userId): array
    {
        $counts = Order::where('user_id', $userId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', [Order::STATUS_PENDING])
            ->selectRaw('COUNT(CASE WHEN status = ? THEN 1 END) as processing', [Order::STATUS_PROCESSING])
            ->selectRaw('COUNT(CASE WHEN status = ? THEN 1 END) as shipped', [Order::STATUS_SHIPPED])
            ->selectRaw('COUNT(CASE WHEN status = ? THEN 1 END) as completed', [Order::STATUS_COMPLETED])
            ->selectRaw('COUNT(CASE WHEN status = ? THEN 1 END) as cancelled', [Order::STATUS_CANCELLED])
            ->first();

        return [
            'total' => (int) $counts->total,
            'pending' => (int) $counts->pending,
            'processing' => (int) $counts->processing,
            'shipped' => (int) $counts->shipped,
            'completed' => (int) $counts->completed,
            'cancelled' => (int) $counts->cancelled,
        ];
    }

    /**
     * Place the order behind checkout.html.
     *
     * Every number is recomputed here from the database. The page posts what
     * the shopper picked, never what it costs: a price in the request body is
     * a price the shopper can edit.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $shippingMethod = ShippingMethod::where('is_active', true)
            ->find($validated['shipping_method_id']);

        $paymentMethod = PaymentMethod::where('is_active', true)
            ->find($validated['payment_method_id']);

        if (! $shippingMethod || ! $paymentMethod) {
            throw ValidationException::withMessages([
                'shipping_method_id' => 'That delivery or payment option is no longer available.',
            ]);
        }

        $address = $this->resolveAddress($user->id, $validated);

        try {
            $order = DB::transaction(function () use ($user, $validated, $shippingMethod, $paymentMethod, $address) {
                /* Locked for the length of the transaction: two shoppers
                   buying the last item at once would otherwise both read the
                   same stock and both be sold it. */
                $product = Product::with('store')
                    ->lockForUpdate()
                    ->find($validated['product_id']);

                $onOffer = $product
                    && $product->status === Product::STATUS_ACTIVE
                    && $product->store
                    && $product->store->status === Store::STATUS_ACTIVE;

                if (! $onOffer) {
                    throw ValidationException::withMessages([
                        'product_id' => 'This product is no longer available.',
                    ]);
                }

                $quantity = (int) $validated['quantity'];

                if ($quantity < $product->minimum_purchase) {
                    throw ValidationException::withMessages([
                        'quantity' => 'This seller asks for at least ' . $product->minimum_purchase . ' per order.',
                    ]);
                }

                if ($quantity > $product->stock) {
                    throw ValidationException::withMessages([
                        'quantity' => $product->stock > 0
                            ? 'Only ' . $product->stock . ' left in stock.'
                            : 'This product is out of stock.',
                    ]);
                }

                $unitPrice = (float) $product->price;
                $subtotal = $unitPrice * $quantity;
                $shippingFee = (float) $this->checkout->shippingFeeFor($shippingMethod, $product);

                // No promotions and no service fee in umkmify.sql yet.
                $discount = 0.0;
                $serviceFee = 0.0;

                $total = $subtotal - $discount + $shippingFee + $serviceFee;

                $order = Order::create([
                    'order_number' => $this->uniqueOrderNumber(),
                    'user_id' => $user->id,

                    'shipping_address_id' => $address->id,

                    /* A copy, not a lookup: the shopper may edit or delete
                       this address later, and the order has to keep saying
                       where it actually went. */
                    'shipping_recipient_name' => $address->recipient_name,
                    'shipping_phone' => $address->phone,
                    'shipping_address' => $address->toSnapshotLine(),
                    'shipping_city' => $address->city,
                    'shipping_province' => $address->province,
                    'shipping_postal_code' => $address->postal_code,

                    'subtotal' => $subtotal,
                    'discount_amount' => $discount,
                    'shipping_fee' => $shippingFee,
                    'service_fee' => $serviceFee,
                    'total_amount' => $total,

                    'status' => Order::STATUS_PENDING,
                ]);

                /* One store per order for now: checkout is reached from Buy
                   it now, which buys a single product. The split exists all
                   the same, so a cart spanning two stores will slot in
                   without reshaping anything. */
                $sellerOrder = SellerOrder::create([
                    'order_id' => $order->id,
                    'store_id' => $product->store_id,
                    'shipping_method_id' => $shippingMethod->id,

                    'subtotal' => $subtotal,
                    'discount_amount' => $discount,
                    'shipping_fee' => $shippingFee,
                    'service_fee' => $serviceFee,
                    'total_amount' => $total,

                    'status' => Order::STATUS_PENDING,
                ]);

                OrderItem::create([
                    'seller_order_id' => $sellerOrder->id,
                    'product_id' => $product->id,

                    'product_name' => $product->name,
                    'sku' => $product->sku,

                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                ]);

                /* Schema.md is explicit that payment state lives here and
                   not in `orders.status`. Nothing takes money yet, so the
                   row opens unpaid. */
                Payment::create([
                    'order_id' => $order->id,
                    'payment_method_id' => $paymentMethod->id,
                    'amount' => $total,
                    'status' => Payment::STATUS_UNPAID,
                ]);

                // Reserved the moment the order is placed rather than when
                // it is paid, so the same unit cannot be sold twice.
                $product->decrement('stock', $quantity);

                return $order;
            });
        } catch (ValidationException $e) {
            throw $e;
        }

        return response()->json([
            'message' => 'Order placed successfully.',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'subtotal' => $order->subtotal,
                'discount_amount' => $order->discount_amount,
                'shipping_fee' => $order->shipping_fee,
                'service_fee' => $order->service_fee,
                'total_amount' => $order->total_amount,
                'payment_method' => $paymentMethod->name,
                'shipping_method' => $shippingMethod->name,
            ],
        ], 201);
    }

    /**
     * The address the order ships to: one the shopper already saved, or the
     * one they just typed in, which is saved so they need not type it twice.
     *
     * @param  array<string, mixed>  $validated
     */
    private function resolveAddress(int $userId, array $validated): Address
    {
        if (! empty($validated['address_id'])) {
            $address = Address::where('user_id', $userId)
                ->find($validated['address_id']);

            if (! $address) {
                throw ValidationException::withMessages([
                    'address_id' => 'That shipping address could not be found.',
                ]);
            }

            return $address;
        }

        return DB::transaction(function () use ($userId, $validated) {
            $isFirst = ! Address::where('user_id', $userId)->exists();

            return Address::create([
                'user_id' => $userId,
                'label' => $validated['label'] ?? 'Home',
                'recipient_name' => $validated['recipient_name'],
                'phone' => $validated['phone'],
                'address_line' => $validated['address_line'],
                'address_line_2' => $validated['address_line_2'] ?? null,
                'province' => $validated['province'],
                'city' => $validated['city'],
                'district' => $validated['district'] ?? null,
                'village' => $validated['village'] ?? null,
                'postal_code' => $validated['postal_code'],

                // The first address a shopper saves is the one to offer next
                // time; after that they choose for themselves.
                'is_default' => $isFirst,
            ]);
        });
    }

    /**
     * `orders_order_number_unique` means this has to be settled before the
     * insert. Dated so a human reading a receipt can tell when it was placed.
     */
    private function uniqueOrderNumber(): string
    {
        do {
            $number = 'UMK-' . now()->format('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
