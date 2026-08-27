CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`costPrice` decimal(12,2) NOT NULL,
	`salePrice` decimal(12,2) NOT NULL,
	`unit` enum('un','kg') NOT NULL,
	`stockCurrent` decimal(14,3) NOT NULL DEFAULT '0.000',
	`stockMinimum` decimal(14,3) NOT NULL DEFAULT '0.000',
	`barcode` varchar(32),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_barcode_unique` UNIQUE(`barcode`)
);
--> statement-breakpoint
CREATE TABLE `saleItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`barcode` varchar(32),
	`unit` enum('un','kg') NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	CONSTRAINT `saleItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentMethod` enum('dinheiro','debito','credito','pix') NOT NULL,
	`totalAmount` decimal(12,2) NOT NULL,
	`amountPaid` decimal(12,2) NOT NULL,
	`changeAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`itemCount` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `saleItems` ADD CONSTRAINT `saleItems_saleId_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saleItems` ADD CONSTRAINT `saleItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_barcode_idx` ON `products` (`barcode`);--> statement-breakpoint
CREATE INDEX `sale_items_sale_id_idx` ON `saleItems` (`saleId`);--> statement-breakpoint
CREATE INDEX `sale_items_product_id_idx` ON `saleItems` (`productId`);--> statement-breakpoint
CREATE INDEX `sales_completed_at_idx` ON `sales` (`completedAt`);