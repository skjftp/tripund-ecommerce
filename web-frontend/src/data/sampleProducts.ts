import { Product } from '../types';

export const sampleProducts: Product[] = [] as Product[];

// Temporarily empty to avoid build errors
// Real products will be fetched from API
export const sampleProductsOld = [
  {
    id: 'faith-in-form-crucifix',
    sku: 'FIF-CRX-001',
    name: '"Faith in Form" – Handcrafted Wall Crucifix with Calabash Gourd Inlay',
    slug: 'faith-in-form-crucifix',
    description: 'A contemporary espresso-toned wall crucifix handcrafted in El Salvador, featuring calabash gourd inlays and enameled wire accents — a modern expression of sacred art for home altars and meditation spaces.',
    short_description: 'Contemporary handcrafted crucifix with gourd inlay',
    price: 10600,
    sale_price: 8150,
    manage_stock: true,
    stock_quantity: 5,
    stock_status: 'in_stock',
    featured: true,
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1548357019-59232d5317c9?w=800',
      'https://images.unsplash.com/photo-1584990347449-a3b8ee63b3e2?w=800',
    ],
    categories: ['spiritual-wall-art', 'religious-art'],
    tags: ['handcrafted', 'spiritual', 'el-salvador', 'contemporary'],
    attributes: [
      { name: 'Material', value: 'Espresso Wood, Calabash Gourd, Enameled Wire' },
      { name: 'Origin', value: 'El Salvador' },
      { name: 'Dimensions', value: '24x16 inches' },
      { name: 'Weight', value: '2.5 kg' },
    ],
    dimensions: {
      length: 24,
      width: 16,
      height: 2,
      unit: 'inches'
    },
    weight: {
      value: 2.5,
      unit: 'kg'
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'owl-guardian-key-rack',
    title: '"Owl Guardian" – Handcrafted Recycled Metal Key Rack',
    description: 'Eco-conscious and design-forward, the "Owl Guardian" key rack is handcrafted from upcycled auto parts by Mexican artisan Armando Ramirez, offering both functional storage and raw industrial artistry.',
    short_description: 'Recycled metal owl key rack',
    price: {
      current: 5900,
      original: 8676,
      currency: '₹',
    },
    discount: 32,
    category: 'Metal Art',
    subcategory: 'Functional Art',
    tags: ['recycled', 'metal', 'mexico', 'functional'],
    images: {
      main: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800',
      gallery: [],
      thumbnails: [],
    },
    inventory: {
      in_stock: true,
      quantity: 8,
      sku: 'OWL-KEY-001',
    },
    artisan: {
      name: 'Armando Ramirez',
      location: 'Mexico',
      story: 'Armando transforms discarded auto parts into stunning works of art, giving new life to metal that would otherwise end up in landfills.',
    },
    specifications: {
      dimensions: '12x8 inches',
      materials: 'Recycled Auto Parts',
      weight: '1.2 kg',
    },
    seo: {
      meta_title: 'Owl Guardian Key Rack - Recycled Metal Art',
      meta_description: 'Eco-friendly key rack made from recycled auto parts',
      keywords: 'key rack, recycled, metal art, functional',
    },
    status: 'active',
    featured: true,
    is_limited: false,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'twin-temples-haze',
    title: '"Twin Temples in Haze" – Set of 2 Handcrafted Temple Silhouette Wall Art',
    description: 'A serene duo of handcrafted temple silhouettes set against a misty, textured backdrop — a modern ode to India\'s timeless spiritual skyline.',
    short_description: 'Temple silhouette wall art set',
    price: {
      current: 7500,
      original: 11030,
      currency: '₹',
    },
    discount: 32,
    category: 'Spiritual Wall Art',
    subcategory: 'Temple Art',
    tags: ['temples', 'spiritual', 'india', 'wall-art'],
    images: {
      main: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
      gallery: [],
      thumbnails: [],
    },
    inventory: {
      in_stock: true,
      quantity: 3,
      sku: 'TEM-ART-002',
    },
    artisan: {
      name: 'Rajasthan Artisan Collective',
      location: 'Rajasthan, India',
      story: 'Our collective of Rajasthani artists draws inspiration from the ancient temples that dot our landscape.',
    },
    specifications: {
      dimensions: '18x24 inches (each)',
      materials: 'Canvas, Acrylic Paint',
      weight: '1.5 kg (set)',
    },
    seo: {
      meta_title: 'Twin Temples Wall Art - Spiritual Home Decor',
      meta_description: 'Set of 2 handcrafted temple silhouette paintings',
      keywords: 'temple art, spiritual, wall art, indian',
    },
    status: 'active',
    featured: false,
    is_limited: true,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
  },
  {
    id: 'madhubani-peacock',
    title: 'Madhubani Peacock – Traditional Bihar Folk Art Painting',
    description: 'Vibrant Madhubani painting featuring intricate peacock motifs, handpainted by traditional artists from Bihar using natural colors.',
    short_description: 'Traditional Madhubani peacock painting',
    price: {
      current: 4500,
      original: 6000,
      currency: '₹',
    },
    discount: 25,
    category: 'Paintings',
    subcategory: 'Folk Art',
    tags: ['madhubani', 'folk-art', 'bihar', 'traditional'],
    images: {
      main: 'https://images.unsplash.com/photo-1578662996442-48f60103fc9e?w=800',
      gallery: [],
      thumbnails: [],
    },
    inventory: {
      in_stock: true,
      quantity: 10,
      sku: 'MAD-PCK-001',
    },
    artisan: {
      name: 'Bihar Folk Artists',
      location: 'Bihar, India',
      story: 'Madhubani art has been passed down through generations in our families, keeping this ancient art form alive.',
    },
    specifications: {
      dimensions: '16x20 inches',
      materials: 'Handmade Paper, Natural Colors',
      weight: '0.5 kg',
    },
    seo: {
      meta_title: 'Madhubani Peacock Painting - Folk Art',
      meta_description: 'Traditional Bihar folk art painting with peacock motifs',
      keywords: 'madhubani, folk art, painting, bihar',
    },
    status: 'active',
    featured: true,
    is_limited: false,
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
  },
];