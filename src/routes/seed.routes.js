/**
 * One-time seed route — protected by SEED_SECRET env var.
 * Remove this file after initial seeding.
 * Usage: POST /api/seed?secret=YOUR_SEED_SECRET
 */
const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();

router.post('/', async (req, res) => {
  const secret = req.query.secret || req.body.secret;
  if (!secret || secret !== (process.env.SEED_SECRET || 'patria-seed-2026')) {
    return res.status(403).json({ message: 'Invalid seed secret' });
  }

  const results = [];
  try {
    const bcrypt   = require('bcryptjs');
    const User     = require('../models/User');
    const Category = require('../models/Category');
    const Product  = require('../models/Product');

    // ── Admin user ──────────────────────────────────────────────────────────
    let admin = await User.findOne({ email: 'admin@patria.com' });
    if (!admin) {
      const hash = await bcrypt.hash('password123', 10);
      admin = await User.create({
        name: 'Super Admin', email: 'admin@patria.com',
        password: hash, role: 'SUPER_ADMIN', isActive: true,
      });
      results.push('✅ Admin created: admin@patria.com / password123');
    } else {
      results.push('ℹ️  Admin already exists');
    }

    // ── Categories ──────────────────────────────────────────────────────────
    const catDefs = [
      { name: 'Coffee',      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', order: 1 },
      { name: 'Cold Drinks', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', order: 2 },
      { name: 'Bakery',      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', order: 3 },
      { name: 'Desserts',    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', order: 4 },
    ];
    const cats = {};
    for (const c of catDefs) {
      let cat = await Category.findOne({ name: c.name });
      if (!cat) cat = await Category.create({ ...c, isActive: true });
      else await Category.findByIdAndUpdate(cat._id, { image: c.image });
      cats[c.name] = cat._id;
    }
    results.push('✅ Categories: ' + Object.keys(cats).join(', '));

    // ── Products ────────────────────────────────────────────────────────────
    const products = [
      {
        name: 'Espresso', description: 'كوب إسبريسو مركّز بنكهة غنية', price: 45,
        images: ['https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600'],
        category: cats['Coffee'], categoryId: cats['Coffee'],
        variantGroups: [
          { name: 'الحجم', required: true, options: [
            { name: 'Single Shot', priceAdjustment: 0 },
            { name: 'Double Shot', priceAdjustment: 15 },
          ]},
          { name: 'درجة التحميص', required: false, options: [
            { name: 'Light Roast', priceAdjustment: 0 },
            { name: 'Medium Roast', priceAdjustment: 0 },
            { name: 'Dark Roast', priceAdjustment: 0 },
          ]},
        ],
      },
      {
        name: 'Cappuccino', description: 'إسبريسو مع حليب مبخّر ورغوة ناعمة', price: 65,
        images: ['https://images.unsplash.com/photo-1534778101976-62847782c213?w=600'],
        category: cats['Coffee'], categoryId: cats['Coffee'],
        variantGroups: [
          { name: 'الحجم', required: true, options: [
            { name: 'Small (8oz)',   priceAdjustment: 0 },
            { name: 'Medium (12oz)', priceAdjustment: 10 },
            { name: 'Large (16oz)',  priceAdjustment: 20 },
          ]},
          { name: 'نوع الحليب', required: false, options: [
            { name: 'حليب عادي',  priceAdjustment: 0 },
            { name: 'حليب لوز',   priceAdjustment: 10 },
            { name: 'حليب شوفان', priceAdjustment: 10 },
          ]},
          { name: 'السكر', required: false, options: [
            { name: 'بدون سكر',     priceAdjustment: 0 },
            { name: 'سكر عادي',     priceAdjustment: 0 },
            { name: 'سيروب فانيليا', priceAdjustment: 8 },
            { name: 'سيروب كراميل', priceAdjustment: 8 },
          ]},
        ],
        extras: [{ name: 'شوكولاتة إضافية', price: 5 }, { name: 'شوت إسبريسو إضافي', price: 15 }],
      },
      {
        name: 'Latte', description: 'إسبريسو ناعم مع الحليب المبخّر', price: 70,
        images: ['https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600'],
        category: cats['Coffee'], categoryId: cats['Coffee'],
        variantGroups: [
          { name: 'الحجم', required: true, options: [
            { name: 'Medium (12oz)', priceAdjustment: 0 },
            { name: 'Large (16oz)',  priceAdjustment: 15 },
          ]},
          { name: 'النكهة', required: false, options: [
            { name: 'بدون نكهة',    priceAdjustment: 0 },
            { name: 'فانيليا لاتيه', priceAdjustment: 10 },
            { name: 'كراميل لاتيه', priceAdjustment: 10 },
            { name: 'هازلنت لاتيه', priceAdjustment: 10 },
          ]},
        ],
      },
      {
        name: 'Iced Coffee', description: 'قهوة مثلجة منعشة', price: 55,
        images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600'],
        category: cats['Cold Drinks'], categoryId: cats['Cold Drinks'],
        variantGroups: [
          { name: 'الحجم', required: true, options: [
            { name: 'Medium', priceAdjustment: 0 },
            { name: 'Large',  priceAdjustment: 15 },
          ]},
          { name: 'نوع الحليب', required: false, options: [
            { name: 'حليب عادي',  priceAdjustment: 0 },
            { name: 'حليب لوز',   priceAdjustment: 10 },
            { name: 'حليب شوفان', priceAdjustment: 10 },
          ]},
        ],
      },
      {
        name: 'Matcha Latte', description: 'ماتشا يابانية مع الحليب المبخّر', price: 80,
        images: ['https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600'],
        category: cats['Cold Drinks'], categoryId: cats['Cold Drinks'],
        variantGroups: [
          { name: 'التقديم', required: true, options: [
            { name: 'Hot',  priceAdjustment: 0 },
            { name: 'Iced', priceAdjustment: 0 },
          ]},
          { name: 'الحجم', required: true, options: [
            { name: 'Medium', priceAdjustment: 0 },
            { name: 'Large',  priceAdjustment: 15 },
          ]},
        ],
      },
      {
        name: 'Croissant', description: 'كرواسون فرنسي بالزبدة طازج', price: 40,
        images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'],
        category: cats['Bakery'], categoryId: cats['Bakery'],
        variantGroups: [
          { name: 'الحشوة', required: false, options: [
            { name: 'سادة',         priceAdjustment: 0 },
            { name: 'شوكولاتة',     priceAdjustment: 10 },
            { name: 'جبن موزاريلا', priceAdjustment: 15 },
          ]},
        ],
      },
      {
        name: 'Cheesecake', description: 'تشيز كيك كريمي بقاعدة البسكويت', price: 75,
        images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600'],
        category: cats['Desserts'], categoryId: cats['Desserts'],
        variantGroups: [
          { name: 'النكهة', required: true, options: [
            { name: 'Classic',    priceAdjustment: 0 },
            { name: 'Lotus',      priceAdjustment: 15 },
            { name: 'Strawberry', priceAdjustment: 10 },
          ]},
        ],
      },
      {
        name: 'Chocolate Brownie', description: 'براوني شوكولاتة دافئ مع آيس كريم', price: 65,
        images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600'],
        category: cats['Desserts'], categoryId: cats['Desserts'],
        variantGroups: [
          { name: 'التقديم', required: false, options: [
            { name: 'بدون آيس كريم', priceAdjustment: 0 },
            { name: 'مع آيس كريم',   priceAdjustment: 15 },
          ]},
        ],
      },
    ];

    let created = 0, updated = 0;
    for (const p of products) {
      const existing = await Product.findOne({ name: p.name });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { ...p, isActive: true });
        updated++;
      } else {
        await Product.create({ ...p, isActive: true, avgRating: 4.5, ratingCount: 12, stockQty: 100 });
        created++;
      }
    }
    results.push(`✅ Products: ${created} created, ${updated} updated`);

    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ message: err.message, results });
  }
});

module.exports = router;
