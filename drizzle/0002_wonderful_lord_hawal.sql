ALTER TABLE `products` ADD `inventoryCode` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD COLUMN `inventoryCode` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_inventoryCode_unique` UNIQUE(`inventoryCode`);
