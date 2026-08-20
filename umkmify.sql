-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 20, 2026 at 10:07 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `umkmify`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(50) NOT NULL,
  `recipient_name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `address_line` varchar(255) NOT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `province` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `district` varchar(100) DEFAULT NULL,
  `village` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `image`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Accessories', 'accessories', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(2, NULL, 'Beverage', 'beverage', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(3, NULL, 'Electronics', 'electronics', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(4, NULL, 'Fashion', 'fashion', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(5, NULL, 'Handcraft', 'handcraft', NULL, NULL, 'active', 5, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(6, NULL, 'Health', 'health', NULL, NULL, 'active', 6, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(7, NULL, 'Hobbies', 'hobbies', NULL, NULL, 'active', 7, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(8, NULL, 'Food', 'food', NULL, NULL, 'active', 8, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(9, NULL, 'Plants', 'plants', NULL, NULL, 'active', 9, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(10, 1, 'Bags', 'accessories-bags', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(11, 1, 'Watches', 'accessories-watches', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(12, 1, 'Jewelry', 'accessories-jewelry', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(13, 1, 'Belts & Wallets', 'accessories-belts-wallets', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(14, 2, 'Coffee', 'beverage-coffee', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(15, 2, 'Tea', 'beverage-tea', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(16, 2, 'Juice & Syrup', 'beverage-juice-syrup', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(17, 2, 'Herbal Drinks', 'beverage-herbal-drinks', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(18, 3, 'Audio', 'electronics-audio', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(19, 3, 'Phone Accessories', 'electronics-phone-accessories', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(20, 3, 'Computer Accessories', 'electronics-computer-accessories', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(21, 3, 'Home Appliances', 'electronics-home-appliances', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(22, 4, 'Men Clothing', 'fashion-men-clothing', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(23, 4, 'Women Clothing', 'fashion-women-clothing', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(24, 4, 'Kids Clothing', 'fashion-kids-clothing', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(25, 4, 'Footwear', 'fashion-footwear', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(26, 5, 'Woodcraft', 'handcraft-woodcraft', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(27, 5, 'Batik & Textile', 'handcraft-batik-textile', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(28, 5, 'Ceramics', 'handcraft-ceramics', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(29, 5, 'Home Decor', 'handcraft-home-decor', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(30, 6, 'Skincare', 'health-skincare', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(31, 6, 'Supplements', 'health-supplements', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(32, 6, 'Personal Care', 'health-personal-care', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(33, 6, 'Medical Supplies', 'health-medical-supplies', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(34, 7, 'Sports', 'hobbies-sports', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(35, 7, 'Music Instruments', 'hobbies-music-instruments', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(36, 7, 'Board Games', 'hobbies-board-games', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(37, 7, 'Collectibles', 'hobbies-collectibles', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(38, 8, 'Snacks', 'food-snacks', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(39, 8, 'Frozen Food', 'food-frozen-food', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(40, 8, 'Ready to Eat', 'food-ready-to-eat', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(41, 8, 'Spices & Seasoning', 'food-spices-seasoning', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(42, 9, 'Ornamental Plants', 'plants-ornamental-plants', NULL, NULL, 'active', 1, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(43, 9, 'Seeds', 'plants-seeds', NULL, NULL, 'active', 2, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(44, 9, 'Pots & Planters', 'plants-pots-planters', NULL, NULL, 'active', 3, '2026-08-20 15:31:04', '2026-08-20 08:31:04'),
(45, 9, 'Fertilizer', 'plants-fertilizer', NULL, NULL, 'active', 4, '2026-08-20 15:31:04', '2026-08-20 08:31:04');


-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_08_18_143025_create_personal_access_tokens_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(30) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shipping_address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shipping_recipient_name` varchar(150) NOT NULL,
  `shipping_phone` varchar(30) NOT NULL,
  `shipping_address` text NOT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_province` varchar(100) NOT NULL,
  `shipping_postal_code` varchar(20) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `service_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `seller_order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `product_variant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `variant_name` varchar(150) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `payment_method_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` varchar(150) DEFAULT NULL,
  `provider_reference` varchar(150) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` varchar(30) NOT NULL DEFAULT 'unpaid',
  `paid_at` timestamp NULL DEFAULT NULL,
  `expired_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `code`, `type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'QRIS', 'qris', 'qr', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(2, 'Bank Transfer', 'bank_transfer', 'bank', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(3, 'E-Wallet', 'ewallet', 'wallet', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(2, 'App\\Models\\User', 2, 'umkmify-spa', '6fab8ff8d5fbf0cb381ec893c1586752ca9ecd3e3ea41a68a5a01c9461960552', '[\"*\"]', NULL, NULL, '2026-08-18 08:35:43', '2026-08-18 08:35:43'),
(4, 'App\\Models\\User', 2, 'umkmify-spa', 'f96f51bc424699003589d9140558f123b1f29d509ee955ed9c180187db274cbb', '[\"*\"]', NULL, NULL, '2026-08-18 08:35:57', '2026-08-18 08:35:57'),
(5, 'App\\Models\\User', 3, 'umkmify-spa', 'a398775b247786f97d5803e7d98098d47a817dda8b17c9141195f9fdebb7bbaf', '[\"*\"]', NULL, NULL, '2026-08-18 08:41:40', '2026-08-18 08:41:40'),
(6, 'App\\Models\\User', 2, 'umkmify-spa', 'e6e2a6807bc817704e3f924c6145f3001a3b93174834806be0116a319e7b5483', '[\"*\"]', '2026-08-18 08:53:39', NULL, '2026-08-18 08:42:22', '2026-08-18 08:53:39'),
(7, 'App\\Models\\User', 2, 'umkmify-spa', 'bfd2f5da2e2f3a6377d6fd15868681700d53c130d6e741cdb2d80647fa8721a1', '[\"*\"]', NULL, NULL, '2026-08-18 08:44:32', '2026-08-18 08:44:32'),
(8, 'App\\Models\\User', 2, 'umkmify-spa', '0468d5d2ce2589c6bf75a9b08deeb6eb12ce999e8e0e2c6e77d0a16a9559589c', '[\"*\"]', NULL, NULL, '2026-08-18 08:44:32', '2026-08-18 08:44:32'),
(9, 'App\\Models\\User', 4, 'umkmify-spa', 'dbe35a2bc8dbbb7220d022f38eabfe4c8645b7d0c2a22e46cab680ace09cd645', '[\"*\"]', NULL, NULL, '2026-08-18 08:54:05', '2026-08-18 08:54:05'),
(10, 'App\\Models\\User', 2, 'umkmify-spa', '422065c9a091827d6291e940e56c79fd915fe958ab01c566c7a110b916517bc5', '[\"*\"]', '2026-08-18 08:54:37', NULL, '2026-08-18 08:54:31', '2026-08-18 08:54:37'),
(11, 'App\\Models\\User', 5, 'umkmify-spa', '5ca4c17109d0c4c5cdb6bc9f1b1422a85b6d3f89c32f2ea0feaa9c2ce61ad678', '[\"*\"]', NULL, NULL, '2026-08-18 09:00:29', '2026-08-18 09:00:29'),
(12, 'App\\Models\\User', 5, 'umkmify-spa', '4685d50a06ac4270ba480862df967e8b05846b7a829c8ce80d4584af4ab96771', '[\"*\"]', NULL, NULL, '2026-08-18 09:00:44', '2026-08-18 09:00:44'),
(13, 'App\\Models\\User', 5, 'umkmify-spa', '3261c184614ac9365921133535898d5abbfb32d247abba6bb03a892370c75724', '[\"*\"]', NULL, NULL, '2026-08-18 09:00:57', '2026-08-18 09:00:57'),
(14, 'App\\Models\\User', 5, 'umkmify-spa', 'dded14721b21992786e21719dffc5fbbca454248e54bda90888513593a05c439', '[\"*\"]', '2026-08-18 09:19:15', NULL, '2026-08-18 09:19:08', '2026-08-18 09:19:15'),
(15, 'App\\Models\\User', 6, 'umkmify-spa', 'edabbdd5fef6a79ca9548006cad6ff31bf9f3a0736498504f0fe18a927ffdb8c', '[\"*\"]', NULL, NULL, '2026-08-18 09:37:21', '2026-08-18 09:37:21'),
(16, 'App\\Models\\User', 5, 'umkmify-spa', '069b0f418d1cc502fb796c2ba265ba5a6092e502650395682c62293a404a0fd3', '[\"*\"]', NULL, NULL, '2026-08-18 09:41:28', '2026-08-18 09:41:28'),
(17, 'App\\Models\\User', 5, 'umkmify-spa', '0fd898e353bc11650b501840c53daa4253d414ac90d4e3735cae83d45c7490e7', '[\"*\"]', NULL, NULL, '2026-08-18 09:43:44', '2026-08-18 09:43:44'),
(22, 'App\\Models\\User', 7, 'umkmify-spa', 'c362ac353132fba1999dea729b25455e2d33dd74f44d240be45d7519ebd5ebb9', '[\"*\"]', '2026-08-18 10:03:01', NULL, '2026-08-18 10:03:00', '2026-08-18 10:03:01'),
(24, 'App\\Models\\User', 5, 'umkmify-spa', '334236d551c5b8546729d62cca4b546f968fe6cfc30ae9d083b34133d19f31f9', '[\"*\"]', '2026-08-19 06:04:32', NULL, '2026-08-19 06:04:32', '2026-08-19 06:04:32'),
(30, 'App\\Models\\User', 5, 'umkmify-spa', '32658127c0b1ac398c1c51b3f348b2e02e7c42221a0dbcc20657d50cd3795f0a', '[\"*\"]', '2026-08-20 01:05:15', NULL, '2026-08-19 20:29:41', '2026-08-20 01:05:15');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `store_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `subcategory_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `minimum_purchase` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `weight` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(30) NOT NULL DEFAULT 'pcs',
  `brand` varchar(100) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `length` decimal(10,2) DEFAULT NULL,
  `width` decimal(10,2) DEFAULT NULL,
  `height` decimal(10,2) DEFAULT NULL,
  `shipping_fee_type` varchar(20) NOT NULL DEFAULT 'buyer',
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `weight` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'customer', '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(2, 'seller', '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(3, 'admin', '2026-08-16 07:01:24', '2026-08-16 07:01:24');

-- --------------------------------------------------------

--
-- Table structure for table `seller_orders`
--

CREATE TABLE `seller_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `store_id` bigint(20) UNSIGNED NOT NULL,
  `shipping_method_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `service_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `seller_note` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipping_methods`
--

CREATE TABLE `shipping_methods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `shipping_methods`
--

INSERT INTO `shipping_methods` (`id`, `name`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'JNT Cargo', 'jnt_cargo', 'JNT Cargo shipping service', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(2, 'JNE', 'jne', 'JNE shipping service', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(3, 'SiCepat', 'sicepat', 'SiCepat shipping service', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24'),
(4, 'AnterAja', 'anteraja', 'AnterAja shipping service', 1, '2026-08-16 07:01:24', '2026-08-16 07:01:24');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `owner_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `banner` varchar(500) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `locale` varchar(10) NOT NULL DEFAULT 'id',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `locale`, `status`, `email_verified_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(2, 'budiumkm', 'budi@umkmify.test', '$2y$12$OQX6LxlUNg3kQ6dspGlRrOzjjzCn4qIu8hR9tiWgE9GM8TRxhfcwO', 'id', 'active', NULL, NULL, '2026-08-18 08:35:43', '2026-08-18 08:35:43'),
(3, 'sitiumkm', 'siti@umkmify.test', '$2y$12$aNMohMiZZzRw1tNs/koKvOdF1VRcJWroQC3IQCrnLXlIEXiKdxuta', 'id', 'active', NULL, NULL, '2026-08-18 08:41:40', '2026-08-18 08:41:40'),
(4, 'dewiumkm', 'dewi@umkmify.test', '$2y$12$AZ4qjWI8349wDGVaolBmfukzMPjpyzylGkCg6gnA1DguldUgy16De', 'id', 'active', NULL, NULL, '2026-08-18 08:54:05', '2026-08-18 08:54:05'),
(5, 'SatoDayo', 'satoriyasan@gmail.com', '$2y$12$mp55sBtm5H1jzhD7lE5x7uha1t4lQk8/bGijwlOJze8IKTquOj.L.', 'id', 'active', NULL, NULL, '2026-08-18 09:00:29', '2026-08-18 09:00:29');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(2, 1),
(3, 1),
(4, 1),
(5, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `addresses_user_id_index` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_slug_unique` (`slug`),
  ADD KEY `categories_parent_id_index` (`parent_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contact_messages_user_id_index` (`user_id`),
  ADD KEY `contact_messages_email_index` (`email`),
  ADD KEY `contact_messages_status_index` (`status`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_unique` (`order_number`),
  ADD KEY `orders_user_id_index` (`user_id`),
  ADD KEY `orders_shipping_address_id_index` (`shipping_address_id`),
  ADD KEY `orders_status_index` (`status`),
  ADD KEY `orders_created_at_index` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_seller_order_id_index` (`seller_order_id`),
  ADD KEY `order_items_product_id_index` (`product_id`),
  ADD KEY `order_items_product_variant_id_index` (`product_variant_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_order_id_index` (`order_id`),
  ADD KEY `payments_payment_method_id_index` (`payment_method_id`),
  ADD KEY `payments_transaction_id_index` (`transaction_id`),
  ADD KEY `payments_provider_reference_index` (`provider_reference`),
  ADD KEY `payments_status_index` (`status`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_methods_code_unique` (`code`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_store_sku_unique` (`store_id`,`sku`),
  ADD KEY `products_category_id_index` (`category_id`),
  ADD KEY `products_subcategory_id_index` (`subcategory_id`),
  ADD KEY `products_status_index` (`status`),
  ADD KEY `products_name_index` (`name`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_images_product_id_index` (`product_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_variants_sku_unique` (`sku`),
  ADD KEY `product_variants_product_id_index` (`product_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`);

--
-- Indexes for table `seller_orders`
--
ALTER TABLE `seller_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seller_orders_order_store_unique` (`order_id`,`store_id`),
  ADD KEY `seller_orders_store_id_index` (`store_id`),
  ADD KEY `seller_orders_shipping_method_id_index` (`shipping_method_id`),
  ADD KEY `seller_orders_status_index` (`status`);

--
-- Indexes for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shipping_methods_code_unique` (`code`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stores_slug_unique` (`slug`),
  ADD KEY `stores_owner_id_index` (`owner_id`),
  ADD KEY `stores_status_index` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_status_index` (`status`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `user_roles_role_id_foreign` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `seller_orders`
--
ALTER TABLE `seller_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD CONSTRAINT `contact_messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_shipping_address_id_foreign` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_product_variant_id_foreign` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_seller_order_id_foreign` FOREIGN KEY (`seller_order_id`) REFERENCES `seller_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_payment_method_id_foreign` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `products_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `products_subcategory_id_foreign` FOREIGN KEY (`subcategory_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `seller_orders`
--
ALTER TABLE `seller_orders`
  ADD CONSTRAINT `seller_orders_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seller_orders_shipping_method_id_foreign` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `seller_orders_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
