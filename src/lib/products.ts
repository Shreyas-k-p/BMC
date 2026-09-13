import { Product } from '../types';

export const CURATED_PRODUCTS: Product[] = [
  // FAILED PRODUCTS
  {
    id: 'prod_fire_phone',
    name: 'Fire Phone',
    company: 'Amazon',
    category: 'FAILED'
  },
  {
    id: 'prod_google_glass',
    name: 'Google Glass',
    company: 'Google',
    category: 'FAILED'
  },
  {
    id: 'prod_juicero',
    name: 'Juicero',
    company: 'Juicero',
    category: 'FAILED'
  },
  {
    id: 'prod_quibi',
    name: 'Quibi',
    company: 'Quibi',
    category: 'FAILED'
  },
  {
    id: 'prod_windows_phone',
    name: 'Windows Phone',
    company: 'Microsoft',
    category: 'FAILED'
  },
  {
    id: 'prod_3d_tv',
    name: '3D TV',
    company: 'Sony / LG',
    category: 'FAILED'
  },
  {
    id: 'prod_segway',
    name: 'Segway',
    company: 'Segway',
    category: 'FAILED'
  },

  // SUCCESSFUL PRODUCTS
  {
    id: 'prod_airbnb',
    name: 'Airbnb',
    company: 'Airbnb',
    category: 'SUCCESSFUL'
  },
  {
    id: 'prod_spotify',
    name: 'Spotify',
    company: 'Spotify',
    category: 'SUCCESSFUL'
  },
  {
    id: 'prod_netflix',
    name: 'Netflix',
    company: 'Netflix',
    category: 'SUCCESSFUL'
  },
  {
    id: 'prod_uber',
    name: 'Uber',
    company: 'Uber',
    category: 'SUCCESSFUL'
  },
  {
    id: 'prod_amazon',
    name: 'Amazon Prime',
    company: 'Amazon',
    category: 'SUCCESSFUL'
  },
  {
    id: 'prod_canva',
    name: 'Canva',
    company: 'Canva',
    category: 'SUCCESSFUL'
  },
  {
    id: 'prod_iphone',
    name: 'iPhone',
    company: 'Apple',
    category: 'SUCCESSFUL'
  }
];

export function getRandomizedProducts(count: number): Product[] {
  const shuffled = [...CURATED_PRODUCTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
