/**
 * Seed test products with variants for Flutter developer testing.
 * Run: docker exec patria-backend node scripts/seedProducts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product  = require('../src/models/Product');

const MONGO_URI = process.env.MONGODB_URI ||
  'mongodb://admin:password123@localhost:27018/patria?authSource=admin';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── 1. Ensure categories exist ────────────────────────────────────────────
  const catDefs = [
    { name: 'Coffee',  image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', isIngredient: false, order: 1 },
    { name: 'Cold Drinks', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', isIngredient: false, order: 2 },
    { name: 'Bakery',  image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', isIngredient: false, order: 3 },
    { name: 'Desserts',image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', isIngredient: false, order: 4 },
  ];

  const cats = {};
  for (const c of catDefs) {
    let cat = await Category.findOne({ name: c.name });
    if (!cat) cat = await Category.create({ ...c, isActive: true });
    else await Category.findByIdAndUpdate(cat._id, { image: c.image, isIngredient: c.isIngredient });
    cats[c.name] = cat._id;
    console.log(`  📁 Category: ${c.name}`);
  }

  // ── 2. Products ───────────────────────────────────────────────────────────
  const products = [
    {
      name:        'Espresso',
      description: 'كوب إسبريسو مركّز بنكهة غنية وعميقة من أجود حبوب البن',
      price:       45,
      category:    cats['Coffee'],
      images:      ['https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600'],
      variantGroups: [
        {
          name: 'الحجم',
          required: true,
          options: [
            { name: 'Single Shot', priceAdjustment: 0 },
            { name: 'Double Shot', priceAdjustment: 15 },
          ],
        },
        {
          name: 'درجة التحميص',
          required: false,
          options: [
            { name: 'Light Roast',  priceAdjustment: 0 },
            { name: 'Medium Roast', priceAdjustment: 0 },
            { name: 'Dark Roast',   priceAdjustment: 0 },
          ],
        },
      ],
      stockQty: 200,
    },
    {
      name:        'Cappuccino',
      description: 'إسبريسو مع حليب مبخّر ورغوة ناعمة — الكلاسيكي الإيطالي',
      price:       65,
      category:    cats['Coffee'],
      images:      ['https://images.unsplash.com/photo-1534778101976-62847782c213?w=600'],
      variantGroups: [
        {
          name: 'الحجم',
          required: true,
          options: [
            { name: 'Small (8oz)',  priceAdjustment: 0 },
            { name: 'Medium (12oz)',priceAdjustment: 10 },
            { name: 'Large (16oz)', priceAdjustment: 20 },
          ],
        },
        {
          name: 'نوع الحليب',
          required: false,
          options: [
            { name: 'حليب عادي',    priceAdjustment: 0 },
            { name: 'حليب لوز',     priceAdjustment: 10 },
            { name: 'حليب شوفان',   priceAdjustment: 10 },
            { name: 'حليب سكر منخفض', priceAdjustment: 0 },
          ],
        },
        {
          name: 'السكر',
          required: false,
          options: [
            { name: 'بدون سكر',     priceAdjustment: 0 },
            { name: 'سكر عادي',     priceAdjustment: 0 },
            { name: 'سيروب فانيليا', priceAdjustment: 8 },
            { name: 'سيروب كراميل', priceAdjustment: 8 },
          ],
        },
      ],
      extras: [
        { name: 'شوكولاتة إضافية', price: 5 },
        { name: 'شوت إسبريسو إضافي', price: 15 },
      ],
      stockQty: 150,
    },
    {
      name:        'Latte',
      description: 'إسبريسو ناعم مع الحليب المبخّر والرغوة الخفيفة',
      price:       70,
      category:    cats['Coffee'],
      images:      ['https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600'],
      variantGroups: [
        {
          name: 'الحجم',
          required: true,
          options: [
            { name: 'Medium (12oz)', priceAdjustment: 0 },
            { name: 'Large (16oz)',  priceAdjustment: 15 },
          ],
        },
        {
          name: 'نوع الحليب',
          required: false,
          options: [
            { name: 'حليب عادي',  priceAdjustment: 0 },
            { name: 'حليب لوز',   priceAdjustment: 10 },
            { name: 'حليب شوفان', priceAdjustment: 10 },
          ],
        },
        {
          name: 'النكهة',
          required: false,
          options: [
            { name: 'بدون نكهة',     priceAdjustment: 0 },
            { name: 'فانيليا لاتيه',  priceAdjustment: 10 },
            { name: 'كراميل لاتيه',  priceAdjustment: 10 },
            { name: 'هازلنت لاتيه',  priceAdjustment: 10 },
          ],
        },
      ],
      stockQty: 150,
    },
    {
      name:        'Iced Coffee',
      description: 'قهوة مثلجة منعشة — مثالية للصيف',
      price:       55,
      category:    cats['Cold Drinks'],
      images:      ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600'],
      variantGroups: [
        {
          name: 'الحجم',
          required: true,
          options: [
            { name: 'Medium', priceAdjustment: 0 },
            { name: 'Large',  priceAdjustment: 15 },
          ],
        },
        {
          name: 'نوع الحليب',
          required: false,
          options: [
            { name: 'حليب عادي',  priceAdjustment: 0 },
            { name: 'حليب لوز',   priceAdjustment: 10 },
            { name: 'حليب شوفان', priceAdjustment: 10 },
          ],
        },
      ],
      stockQty: 100,
    },
    {
      name:        'Matcha Latte',
      description: 'ماتشا يابانية أصيلة مع الحليب المبخّر',
      price:       80,
      category:    cats['Cold Drinks'],
      images:      ['https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600'],
      variantGroups: [
        {
          name: 'الحجم',
          required: true,
          options: [
            { name: 'Medium (12oz)', priceAdjustment: 0 },
            { name: 'Large (16oz)',  priceAdjustment: 15 },
          ],
        },
        {
          name: 'التقديم',
          required: true,
          options: [
            { name: 'Hot',  priceAdjustment: 0 },
            { name: 'Iced', priceAdjustment: 0 },
          ],
        },
      ],
      stockQty: 80,
    },
    {
      name:        'Croissant',
      description: 'كرواسون فرنسي بالزبدة — طازج من الفرن',
      price:       40,
      category:    cats['Bakery'],
      images:      ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'],
      variantGroups: [
        {
          name: 'الحشوة',
          required: false,
          options: [
            { name: 'سادة',         priceAdjustment: 0 },
            { name: 'شوكولاتة',     priceAdjustment: 10 },
            { name: 'جبن موزاريلا', priceAdjustment: 15 },
            { name: 'لوز وعسل',     priceAdjustment: 15 },
          ],
        },
      ],
      stockQty: 50,
    },
    {
      name:        'Cheesecake',
      description: 'تشيز كيك كريمي بقاعدة البسكويت — وصفة أمريكية أصيلة',
      price:       75,
      category:    cats['Desserts'],
      images:      ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600'],
      variantGroups: [
        {
          name: 'النكهة',
          required: true,
          options: [
            { name: 'Classic',      priceAdjustment: 0 },
            { name: 'Lotus',        priceAdjustment: 15 },
            { name: 'Strawberry',   priceAdjustment: 10 },
            { name: 'Blueberry',    priceAdjustment: 10 },
          ],
        },
      ],
      stockQty: 30,
    },
  ];

  let created = 0, updated = 0;
  for (const p of products) {
    p.categoryId = p.category;
    const existing = await Product.findOne({ name: p.name });
    if (existing) {
      await Product.findByIdAndUpdate(existing._id, p);
      updated++;
    } else {
      await Product.create({ ...p, isActive: true, avgRating: 4.5, ratingCount: 12 });
      created++;
    }
    console.log(`  ☕ ${existing ? 'Updated' : 'Created'}: ${p.name}`);
  }

  console.log(`\n✅ Done! Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
