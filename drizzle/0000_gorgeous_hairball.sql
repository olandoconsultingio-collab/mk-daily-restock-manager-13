CREATE TABLE `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`station` text NOT NULL,
	`product` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'not_checked' NOT NULL,
	`refill` text DEFAULT 'not_needed' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`date`) REFERENCES `workdays`(`date`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_station_product` ON `inspections` (`date`,`station`,`product`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`stations` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_name` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `shortages` (
	`id` text PRIMARY KEY NOT NULL,
	`inspection` text NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`station` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`inspection`) REFERENCES `inspections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inspection_shortage` ON `shortages` (`inspection`);--> statement-breakpoint
CREATE TABLE `workdays` (
	`date` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
