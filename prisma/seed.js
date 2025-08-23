import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	const categories = [
		"Equipment",
		"Furniture",
		"Book",
		"Other",
		"Electronics",
		"Stationery",
		"Appliances",
		"Clothing",
		"Sports",
		"Toys",
		"Software",
		"Hardware",
		"Vehicles",
		"Jewelry",
		"Art",
		"Music",
		"Photography",
		"Office Supplies",
		"Kitchenware",
		"Gardening",
		"Medical",
		"Tools",
		"Pet Supplies",
		"Automotive",
		"Fitness",
		"Outdoor",
		"Hobby",
		"Collectibles",
		"Travel",
		"Furniture Accessories",
		"Miscellaneous",
	];
	const tags = [
		"important",
		"new",
		"outdated",
		"in-progress",
		"review",
		"approved",
		"pending",
		"archived",
		"featured",
		"popular",
		"limited",
		"discounted",
		"seasonal",
		"exclusive",
		"urgent",
		"low-priority",
		"high-priority",
		"draft",
		"completed",
		"deprecated",
		"experimental",
		"verified",
		"unverified",
		"flagged",
		"favorite",
	];

	for (const name of categories) {
		await prisma.category.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}
	console.log("Categories seeded ✅");

	for (const name of tags) {
		await prisma.tag.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}
	console.log("Tags seeded ✅");
}

main()
	.catch((e) => console.error(e))
	.finally(async () => await prisma.$disconnect());
