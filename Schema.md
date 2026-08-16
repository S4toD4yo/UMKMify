# UMKMify Database Schema

## 1. Overview

This document defines the current database schema specification for the
UMKMify e-commerce platform.

The schema is derived from the current UMKMify UI/UX design and is
designed for a multi-vendor marketplace architecture.

**Database Engine:** MySQL\
**Storage Engine:** InnoDB\
**Character Set:** utf8mb4

This document is currently a schema specification and is not yet the
final Laravel migration implementation.

------------------------------------------------------------------------

## 2. Database Architecture

``` text
users
│
├── user_roles
│      └── roles
│
├── addresses
│
├── stores
│      │
│      └── products
│             ├── product_images
│             ├── product_variants
│             └── categories
│
├── orders
│      │
│      ├── seller_orders
│      │      │
│      │      └── order_items
│      │
│      └── payments
│             └── payment_methods
│
└── contact_messages

seller_orders
└── shipping_methods
```

------------------------------------------------------------------------

# 3. Authentication & User Management

## 3.1 `users`

Stores all registered UMKMify users.

  -------------------------------------------------------------------------------------
  Column                Type                    Nullable Key           Description
  --------------------- -------------- ----------------- ------------- ----------------
  `id`                  BIGINT                        No PK            User identifier
                        UNSIGNED                                       

  `username`            VARCHAR(50)                   No UNIQUE        Unique username

  `email`               VARCHAR(255)                  No UNIQUE        User email

  `password`            VARCHAR(255)                  No               Hashed password

  `locale`              VARCHAR(10)                   No               Preferred
                                                                       interface
                                                                       language

  `status`              VARCHAR(20)                   No               Account status

  `email_verified_at`   TIMESTAMP                    Yes               Email
                                                                       verification
                                                                       timestamp

  `remember_token`      VARCHAR(100)                 Yes               Authentication
                                                                       remember token

  `created_at`          TIMESTAMP                     No               Creation
                                                                       timestamp

  `updated_at`          TIMESTAMP                     No               Last update
                                                                       timestamp
  -------------------------------------------------------------------------------------

### Recommended Status

``` text
active
pending
suspended
banned
```

Passwords must never be stored in plaintext.

------------------------------------------------------------------------

## 3.2 `roles`

Stores available system roles.

  Column         Type                Nullable Key      Description
  -------------- ----------------- ---------- -------- -----------------------
  `id`           BIGINT UNSIGNED           No PK       Role identifier
  `name`         VARCHAR(50)               No UNIQUE   Role name
  `created_at`   TIMESTAMP                 No          Creation timestamp
  `updated_at`   TIMESTAMP                 No          Last update timestamp

### Initial Roles

``` text
customer
seller
admin
```

------------------------------------------------------------------------

## 3.3 `user_roles`

Many-to-many relationship between users and roles.

  Column      Type                Nullable Key   Description
  ----------- ----------------- ---------- ----- -----------------------
  `user_id`   BIGINT UNSIGNED           No FK    References `users.id`
  `role_id`   BIGINT UNSIGNED           No FK    References `roles.id`

Primary Key:

``` text
(user_id, role_id)
```

------------------------------------------------------------------------

# 4. Seller & Store

## 4.1 `stores`

Represents a seller's marketplace store.

  Column          Type                Nullable Key      Description
  --------------- ----------------- ---------- -------- -------------------------------
  `id`            BIGINT UNSIGNED           No PK       Store identifier
  `owner_id`      BIGINT UNSIGNED           No FK       References `users.id`
  `name`          VARCHAR(150)              No          Store name
  `slug`          VARCHAR(180)              No UNIQUE   URL-friendly store identifier
  `description`   TEXT                     Yes          Store description
  `logo`          VARCHAR(500)             Yes          Store logo URL
  `banner`        VARCHAR(500)             Yes          Store banner URL
  `phone`         VARCHAR(30)              Yes          Store contact number
  `status`        VARCHAR(20)               No          Store status
  `created_at`    TIMESTAMP                 No          Creation timestamp
  `updated_at`    TIMESTAMP                 No          Last update timestamp

### Recommended Status

``` text
active
inactive
suspended
```

Relationship:

``` text
users 1:N stores
```

------------------------------------------------------------------------

# 5. Product Catalog

## 5.1 `categories`

Stores product categories and subcategories using a self-referencing
hierarchy.

  Column          Type                Nullable Key      Description
  --------------- ----------------- ---------- -------- -------------------------
  `id`            BIGINT UNSIGNED           No PK       Category identifier
  `parent_id`     BIGINT UNSIGNED          Yes FK       Parent category
  `name`          VARCHAR(100)              No          Category name
  `slug`          VARCHAR(120)              No UNIQUE   URL-friendly identifier
  `description`   TEXT                     Yes          Category description
  `image`         VARCHAR(500)             Yes          Category image URL
  `status`        VARCHAR(20)               No          Category status
  `sort_order`    INT UNSIGNED              No          Display order
  `created_at`    TIMESTAMP                 No          Creation timestamp
  `updated_at`    TIMESTAMP                 No          Last update timestamp

Relationship:

``` text
categories 1:N categories
```

------------------------------------------------------------------------

## 5.2 `products`

Stores products listed by sellers.

  --------------------------------------------------------------------------------------
  Column                Type                     Nullable Key           Description
  --------------------- --------------- ----------------- ------------- ----------------
  `id`                  BIGINT UNSIGNED                No PK            Product
                                                                        identifier

  `store_id`            BIGINT UNSIGNED                No FK            Product owner

  `name`                VARCHAR(255)                   No               Product name

  `sku`                 VARCHAR(100)                   No INDEX         Product SKU

  `category_id`         BIGINT UNSIGNED                No FK            Product category

  `subcategory_id`      BIGINT UNSIGNED               Yes FK            Product
                                                                        subcategory

  `description`         TEXT                           No               Product
                                                                        description

  `price`               DECIMAL(15,2)                  No               Base selling
                                                                        price

  `minimum_purchase`    INT UNSIGNED                   No               Minimum purchase
                                                                        quantity

  `stock`               INT UNSIGNED                   No               Current stock
                                                                        for simple
                                                                        products

  `weight`              DECIMAL(10,2)                  No               Product weight
                                                                        in grams

  `unit`                VARCHAR(30)                    No               Product unit

  `brand`               VARCHAR(100)                  Yes               Product brand

  `location`            VARCHAR(150)                  Yes               Seller/product
                                                                        location

  `length`              DECIMAL(10,2)                 Yes               Product length
                                                                        in cm

  `width`               DECIMAL(10,2)                 Yes               Product width in
                                                                        cm

  `height`              DECIMAL(10,2)                 Yes               Product height
                                                                        in cm

  `shipping_fee_type`   VARCHAR(20)                    No               Shipping cost
                                                                        responsibility

  `status`              VARCHAR(20)                    No               Product
                                                                        lifecycle status

  `published_at`        TIMESTAMP                     Yes               Publication
                                                                        timestamp

  `created_at`          TIMESTAMP                      No               Creation
                                                                        timestamp

  `updated_at`          TIMESTAMP                      No               Last update
                                                                        timestamp

  `deleted_at`          TIMESTAMP                     Yes               Soft deletion
                                                                        timestamp
  --------------------------------------------------------------------------------------

### Recommended Status

``` text
draft
active
inactive
```

### Recommended Shipping Fee Types

``` text
buyer
seller
```

Relationships:

``` text
stores 1:N products
categories 1:N products
```

------------------------------------------------------------------------

## 5.3 `product_images`

Stores product image references.

  Column         Type                Nullable Key   Description
  -------------- ----------------- ---------- ----- -----------------------
  `id`           BIGINT UNSIGNED           No PK    Image identifier
  `product_id`   BIGINT UNSIGNED           No FK    Product identifier
  `image_url`    VARCHAR(500)              No       Image URL
  `is_primary`   BOOLEAN                   No       Main product image
  `sort_order`   INT UNSIGNED              No       Image display order
  `created_at`   TIMESTAMP                 No       Creation timestamp
  `updated_at`   TIMESTAMP                 No       Last update timestamp

Relationship:

``` text
products 1:N product_images
```

The current UI supports a maximum of five product images.

The five-image restriction should be enforced at the application layer.

------------------------------------------------------------------------

## 5.4 `product_variants`

Stores product variations such as size, color, design, or other
seller-defined variations.

  Column         Type                Nullable Key     Description
  -------------- ----------------- ---------- ------- -----------------------
  `id`           BIGINT UNSIGNED           No PK      Variant identifier
  `product_id`   BIGINT UNSIGNED           No FK      Parent product
  `sku`          VARCHAR(100)             Yes INDEX   Variant SKU
  `name`         VARCHAR(150)              No         Variant display name
  `price`        DECIMAL(15,2)             No         Variant price
  `stock`        INT UNSIGNED              No         Variant stock
  `weight`       DECIMAL(10,2)            Yes         Variant weight
  `status`       VARCHAR(20)               No         Variant status
  `created_at`   TIMESTAMP                 No         Creation timestamp
  `updated_at`   TIMESTAMP                 No         Last update timestamp

Relationship:

``` text
products 1:N product_variants
```

Example:

``` text
Dakimakura Gawr Gura
├── 160 x 50 cm
├── 150 x 50 cm
└── 120 x 40 cm
```

------------------------------------------------------------------------

# 6. Customer Addresses

## 6.1 `addresses`

Stores customer shipping addresses.

  Column             Type                Nullable Key   Description
  ------------------ ----------------- ---------- ----- -----------------------
  `id`               BIGINT UNSIGNED           No PK    Address identifier
  `user_id`          BIGINT UNSIGNED           No FK    Address owner
  `label`            VARCHAR(50)               No       Address label
  `recipient_name`   VARCHAR(150)              No       Package recipient
  `phone`            VARCHAR(30)               No       Recipient phone
  `address_line`     VARCHAR(255)              No       Main address
  `address_line_2`   VARCHAR(255)             Yes       Additional address
  `province`         VARCHAR(100)              No       Province
  `city`             VARCHAR(100)              No       City
  `district`         VARCHAR(100)             Yes       District
  `village`          VARCHAR(100)             Yes       Village
  `postal_code`      VARCHAR(20)               No       Postal code
  `latitude`         DECIMAL(10,7)            Yes       Latitude
  `longitude`        DECIMAL(10,7)            Yes       Longitude
  `is_default`       BOOLEAN                   No       Default address
  `created_at`       TIMESTAMP                 No       Creation timestamp
  `updated_at`       TIMESTAMP                 No       Last update timestamp

Relationship:

``` text
users 1:N addresses
```

------------------------------------------------------------------------

# 7. Orders & Transactions

## 7.1 `orders`

Represents the customer's complete checkout transaction.

  -----------------------------------------------------------------------------------------
  Column                      Type                     Nullable Key           Description
  --------------------------- --------------- ----------------- ------------- -------------
  `id`                        BIGINT UNSIGNED                No PK            Internal
                                                                              order
                                                                              identifier

  `order_number`              VARCHAR(30)                    No UNIQUE        Public order
                                                                              number

  `user_id`                   BIGINT UNSIGNED                No FK            Customer

  `shipping_address_id`       BIGINT UNSIGNED               Yes FK            Address used
                                                                              during
                                                                              checkout

  `shipping_recipient_name`   VARCHAR(150)                   No               Address
                                                                              snapshot

  `shipping_phone`            VARCHAR(30)                    No               Phone
                                                                              snapshot

  `shipping_address`          TEXT                           No               Address
                                                                              snapshot

  `shipping_city`             VARCHAR(100)                   No               City snapshot

  `shipping_province`         VARCHAR(100)                   No               Province
                                                                              snapshot

  `shipping_postal_code`      VARCHAR(20)                    No               Postal code
                                                                              snapshot

  `subtotal`                  DECIMAL(15,2)                  No               Product
                                                                              subtotal

  `discount_amount`           DECIMAL(15,2)                  No               Total
                                                                              discount

  `shipping_fee`              DECIMAL(15,2)                  No               Total
                                                                              shipping fee

  `service_fee`               DECIMAL(15,2)                  No               Platform
                                                                              service fee

  `total_amount`              DECIMAL(15,2)                  No               Final
                                                                              transaction
                                                                              amount

  `status`                    VARCHAR(20)                    No INDEX         Order
                                                                              lifecycle
                                                                              status

  `created_at`                TIMESTAMP                      No INDEX         Order
                                                                              creation time

  `updated_at`                TIMESTAMP                      No               Last update
                                                                              timestamp
  -----------------------------------------------------------------------------------------

### Recommended Order Status

``` text
pending
processing
shipped
completed
cancelled
```

Order status represents the fulfillment lifecycle.

Payment status must not be stored in this field.

------------------------------------------------------------------------

## 7.2 `seller_orders`

Splits a customer's order by seller/store.

This table is required because a single checkout may contain products
from multiple sellers.

  Column              Type                Nullable Key     Description
  ------------------- ----------------- ---------- ------- ----------------------------
  `id`                BIGINT UNSIGNED           No PK      Seller order identifier
  `order_id`          BIGINT UNSIGNED           No FK      Parent order
  `store_id`          BIGINT UNSIGNED           No FK      Seller store
  `subtotal`          DECIMAL(15,2)             No         Seller subtotal
  `discount_amount`   DECIMAL(15,2)             No         Seller discount
  `shipping_fee`      DECIMAL(15,2)             No         Seller shipping fee
  `service_fee`       DECIMAL(15,2)             No         Seller-related service fee
  `total_amount`      DECIMAL(15,2)             No         Seller order total
  `seller_note`       TEXT                     Yes         Customer note for seller
  `status`            VARCHAR(20)               No INDEX   Seller order status
  `created_at`        TIMESTAMP                 No         Creation timestamp
  `updated_at`        TIMESTAMP                 No         Last update timestamp

Relationships:

``` text
orders 1:N seller_orders
stores 1:N seller_orders
```

------------------------------------------------------------------------

## 7.3 `order_items`

Stores individual products purchased in a seller order.

  Column                 Type                Nullable Key   Description
  ---------------------- ----------------- ---------- ----- ------------------------
  `id`                   BIGINT UNSIGNED           No PK    Order item identifier
  `seller_order_id`      BIGINT UNSIGNED           No FK    Seller order
  `product_id`           BIGINT UNSIGNED           No FK    Original product
  `product_variant_id`   BIGINT UNSIGNED          Yes FK    Selected variant
  `product_name`         VARCHAR(255)              No       Product name snapshot
  `variant_name`         VARCHAR(150)             Yes       Variant name snapshot
  `sku`                  VARCHAR(100)             Yes       SKU snapshot
  `unit_price`           DECIMAL(15,2)             No       Price at purchase time
  `quantity`             INT UNSIGNED              No       Purchased quantity
  `subtotal`             DECIMAL(15,2)             No       Item subtotal
  `created_at`           TIMESTAMP                 No       Creation timestamp
  `updated_at`           TIMESTAMP                 No       Last update timestamp

Relationships:

``` text
seller_orders 1:N order_items
products 1:N order_items
product_variants 1:N order_items
```

Product information and pricing are stored as snapshots so historical
transactions are not affected by future product changes.

------------------------------------------------------------------------

# 8. Payment

## 8.1 `payment_methods`

Stores available payment methods.

  Column         Type                Nullable Key      Description
  -------------- ----------------- ---------- -------- ---------------------------
  `id`           BIGINT UNSIGNED           No PK       Payment method identifier
  `name`         VARCHAR(100)              No          Display name
  `code`         VARCHAR(50)               No UNIQUE   Internal payment code
  `type`         VARCHAR(50)               No          Payment category
  `is_active`    BOOLEAN                   No          Availability
  `created_at`   TIMESTAMP                 No          Creation timestamp
  `updated_at`   TIMESTAMP                 No          Last update timestamp

Example:

``` text
QRIS
Bank Transfer
E-Wallet
```

------------------------------------------------------------------------

## 8.2 `payments`

Stores actual payment transactions.

  ------------------------------------------------------------------------------------
  Column                 Type                     Nullable Key           Description
  ---------------------- --------------- ----------------- ------------- -------------
  `id`                   BIGINT UNSIGNED                No PK            Payment
                                                                         identifier

  `order_id`             BIGINT UNSIGNED                No FK            Related order

  `payment_method_id`    BIGINT UNSIGNED                No FK            Payment
                                                                         method

  `transaction_id`       VARCHAR(150)                  Yes INDEX         Internal
                                                                         transaction
                                                                         identifier

  `provider_reference`   VARCHAR(150)                  Yes INDEX         External
                                                                         payment
                                                                         provider
                                                                         reference

  `amount`               DECIMAL(15,2)                  No               Payment
                                                                         amount

  `status`               VARCHAR(30)                    No INDEX         Payment
                                                                         status

  `paid_at`              TIMESTAMP                     Yes               Payment
                                                                         completion
                                                                         time

  `expired_at`           TIMESTAMP                     Yes               Payment
                                                                         expiration
                                                                         time

  `created_at`           TIMESTAMP                      No               Creation
                                                                         timestamp

  `updated_at`           TIMESTAMP                      No               Last update
                                                                         timestamp
  ------------------------------------------------------------------------------------

### Recommended Payment Status

``` text
unpaid
pending
paid
failed
expired
refunded
```

Payment status represents the payment lifecycle and must remain separate
from order status.

Relationships:

``` text
orders 1:N payments
payment_methods 1:N payments
```

------------------------------------------------------------------------

# 9. Shipping

## 9.1 `shipping_methods`

Stores available shipping services.

  Column          Type                Nullable Key      Description
  --------------- ----------------- ---------- -------- ----------------------------
  `id`            BIGINT UNSIGNED           No PK       Shipping method identifier
  `name`          VARCHAR(100)              No          Shipping provider/service
  `code`          VARCHAR(50)               No UNIQUE   Internal shipping code
  `description`   VARCHAR(255)             Yes          Service description
  `is_active`     BOOLEAN                   No          Availability
  `created_at`    TIMESTAMP                 No          Creation timestamp
  `updated_at`    TIMESTAMP                 No          Last update timestamp

Example:

``` text
JNT Cargo
JNE
SiCepat
AnterAja
```

Actual shipping fees must be stored on the transaction because shipping
cost depends on destination, weight, dimensions, service, and other
calculation factors.

------------------------------------------------------------------------

# 10. Platform Communication

## 10.1 `contact_messages`

Stores messages submitted through the Contact Us form.

  -----------------------------------------------------------------------------
  Column         Type                    Nullable Key           Description
  -------------- -------------- ----------------- ------------- ---------------
  `id`           BIGINT                        No PK            Message
                 UNSIGNED                                       identifier

  `user_id`      BIGINT                       Yes FK            Authenticated
                 UNSIGNED                                       user, if
                                                                available

  `name`         VARCHAR(100)                  No               Sender name

  `email`        VARCHAR(255)                  No INDEX         Sender email

  `subject`      VARCHAR(150)                  No               Message subject

  `message`      TEXT                          No               Message content

  `status`       VARCHAR(30)                   No INDEX         Support message
                                                                status

  `created_at`   TIMESTAMP                     No               Submission
                                                                timestamp

  `updated_at`   TIMESTAMP                     No               Last update
                                                                timestamp
  -----------------------------------------------------------------------------

### Recommended Status

``` text
new
read
in_progress
resolved
spam
```

`user_id` is nullable because the Contact Us page may be used by guests.

------------------------------------------------------------------------

# 11. Relationship Summary

``` text
users
│
├──< user_roles >── roles
│
├──< addresses
│
├──< stores
│       │
│       └──< products
│               │
│               ├──< product_images
│               │
│               └──< product_variants
│
├──< orders
│       │
│       ├──< seller_orders
│       │       │
│       │       └──< order_items
│       │
│       └──< payments >── payment_methods
│
└──< contact_messages

categories
│
└──< categories

categories
│
└──< products

shipping_methods
│
└──< seller_orders
```

------------------------------------------------------------------------

# 12. Current Confirmed Tables

Based on the current UI/UX designs, the following tables are considered
confirmed:

``` text
users
roles
user_roles

stores

categories
products
product_images
product_variants

addresses

orders
seller_orders
order_items

payment_methods
payments

shipping_methods

contact_messages
```

------------------------------------------------------------------------

# 13. Pending Tables

The following entities have been identified but are not yet finalized
because their corresponding UI flows have not been reviewed:

``` text
carts
cart_items

wishlists
wishlist_items

shipments
shipment_tracking

reviews

vouchers
promotions

notifications
```

These tables must not be implemented until their business rules and UI
flows are confirmed.

------------------------------------------------------------------------

# 14. Design Rules

## 14.1 Monetary Values

All monetary values must use:

``` text
DECIMAL(15,2)
```

Do not use `FLOAT` or `DOUBLE` for monetary values.

## 14.2 Primary Keys

Tables should use:

``` text
BIGINT UNSIGNED AUTO_INCREMENT
```

for internal primary keys unless a future architectural decision
requires UUIDs.

## 14.3 Foreign Keys

Foreign keys must enforce referential integrity using MySQL InnoDB.

## 14.4 Timestamps

All major entities should contain:

``` text
created_at
updated_at
```

Laravel timestamp conventions should be followed.

## 14.5 Soft Deletes

Entities that may have historical references should use soft deletion
where appropriate.

Current candidate:

``` text
products.deleted_at
```

Additional soft-delete requirements may be introduced after reviewing
the remaining UI flows.

## 14.6 Historical Transaction Data

Order records must preserve historical transaction information.

The following fields should be stored as snapshots:

``` text
product_name
variant_name
sku
unit_price

shipping_recipient_name
shipping_phone
shipping_address
shipping_city
shipping_province
shipping_postal_code
```

This prevents changes to current user, product, or address data from
modifying historical orders.

------------------------------------------------------------------------

# 15. Schema Status

``` text
Version: 0.1.0
Status: Draft / UI-Validated
Database: MySQL
Backend: Laravel 12
```

This schema will be updated as additional UMKMify UI/UX flows are
reviewed.

The final SQL migrations and Eloquent relationships should only be
generated after the core UI and business flows have been validated.
