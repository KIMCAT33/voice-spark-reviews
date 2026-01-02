// Mock product data - replaces Shopify API
export interface MockProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

// Import local images
import anuaNiacinamideSerum from '@/assets/anua-niacinamide-serum.png';
import collagenJellyCream from '@/assets/collagen-jelly-cream.png';
import glowBlemishBalm from '@/assets/glow-blemish-balm.png';
import glowGuavaCleanser from '@/assets/glow-guava-cleanser.png';
import manyoCleansingFoam from '@/assets/manyo-cleansing-foam.png';
import manyoCleansingOil from '@/assets/manyo-cleansing-oil.png';

export const mockProducts: MockProduct[] = [
  {
    node: {
      id: 'mock-product-1',
      title: 'ANUA Niacinamide 10% Serum',
      description: 'A brightening serum with 10% niacinamide to help minimize pores, control sebum, and improve skin texture. Perfect for oily and combination skin types.',
      handle: 'anua-niacinamide-serum',
      priceRange: {
        minVariantPrice: {
          amount: '24.99',
          currencyCode: 'USD',
        },
      },
      images: {
        edges: [
          {
            node: {
              url: anuaNiacinamideSerum,
              altText: 'ANUA Niacinamide Serum',
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'mock-variant-1',
              title: 'Default',
              price: {
                amount: '24.99',
                currencyCode: 'USD',
              },
              availableForSale: true,
              selectedOptions: [{ name: 'Size', value: '30ml' }],
            },
          },
        ],
      },
      options: [{ name: 'Size', values: ['30ml'] }],
    },
  },
  {
    node: {
      id: 'mock-product-2',
      title: 'Collagen Jelly Cream',
      description: 'A bouncy jelly cream infused with collagen to hydrate and plump the skin. Lightweight formula absorbs quickly without leaving a greasy residue.',
      handle: 'collagen-jelly-cream',
      priceRange: {
        minVariantPrice: {
          amount: '32.00',
          currencyCode: 'USD',
        },
      },
      images: {
        edges: [
          {
            node: {
              url: collagenJellyCream,
              altText: 'Collagen Jelly Cream',
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'mock-variant-2',
              title: 'Default',
              price: {
                amount: '32.00',
                currencyCode: 'USD',
              },
              availableForSale: true,
              selectedOptions: [{ name: 'Size', value: '50ml' }],
            },
          },
        ],
      },
      options: [{ name: 'Size', values: ['50ml'] }],
    },
  },
  {
    node: {
      id: 'mock-product-3',
      title: 'Glow Blemish Balm',
      description: 'A multi-functional BB cream that provides coverage while treating blemishes. Contains nourishing ingredients to improve skin health over time.',
      handle: 'glow-blemish-balm',
      priceRange: {
        minVariantPrice: {
          amount: '28.50',
          currencyCode: 'USD',
        },
      },
      images: {
        edges: [
          {
            node: {
              url: glowBlemishBalm,
              altText: 'Glow Blemish Balm',
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'mock-variant-3',
              title: 'Default',
              price: {
                amount: '28.50',
                currencyCode: 'USD',
              },
              availableForSale: true,
              selectedOptions: [{ name: 'Shade', value: 'Light' }],
            },
          },
        ],
      },
      options: [{ name: 'Shade', values: ['Light', 'Medium', 'Dark'] }],
    },
  },
  {
    node: {
      id: 'mock-product-4',
      title: 'Glow Guava Vitamin C Cleanser',
      description: 'A gentle yet effective cleanser enriched with guava extract and vitamin C. Brightens skin while removing impurities and makeup.',
      handle: 'glow-guava-cleanser',
      priceRange: {
        minVariantPrice: {
          amount: '18.99',
          currencyCode: 'USD',
        },
      },
      images: {
        edges: [
          {
            node: {
              url: glowGuavaCleanser,
              altText: 'Glow Guava Cleanser',
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'mock-variant-4',
              title: 'Default',
              price: {
                amount: '18.99',
                currencyCode: 'USD',
              },
              availableForSale: true,
              selectedOptions: [{ name: 'Size', value: '150ml' }],
            },
          },
        ],
      },
      options: [{ name: 'Size', values: ['150ml'] }],
    },
  },
  {
    node: {
      id: 'mock-product-5',
      title: 'Manyo Pure Cleansing Foam',
      description: 'A creamy foam cleanser that deeply cleanses pores without stripping moisture. Suitable for all skin types, especially sensitive skin.',
      handle: 'manyo-cleansing-foam',
      priceRange: {
        minVariantPrice: {
          amount: '22.00',
          currencyCode: 'USD',
        },
      },
      images: {
        edges: [
          {
            node: {
              url: manyoCleansingFoam,
              altText: 'Manyo Cleansing Foam',
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'mock-variant-5',
              title: 'Default',
              price: {
                amount: '22.00',
                currencyCode: 'USD',
              },
              availableForSale: true,
              selectedOptions: [{ name: 'Size', value: '200ml' }],
            },
          },
        ],
      },
      options: [{ name: 'Size', values: ['200ml'] }],
    },
  },
  {
    node: {
      id: 'mock-product-6',
      title: 'Manyo Pure Cleansing Oil',
      description: 'A lightweight cleansing oil that effectively removes makeup and sunscreen. Transforms into a milky emulsion when mixed with water.',
      handle: 'manyo-cleansing-oil',
      priceRange: {
        minVariantPrice: {
          amount: '26.00',
          currencyCode: 'USD',
        },
      },
      images: {
        edges: [
          {
            node: {
              url: manyoCleansingOil,
              altText: 'Manyo Cleansing Oil',
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'mock-variant-6',
              title: 'Default',
              price: {
                amount: '26.00',
                currencyCode: 'USD',
              },
              availableForSale: true,
              selectedOptions: [{ name: 'Size', value: '200ml' }],
            },
          },
        ],
      },
      options: [{ name: 'Size', values: ['200ml'] }],
    },
  },
];

export function getProductByHandle(handle: string): MockProduct | undefined {
  return mockProducts.find(p => p.node.handle === handle);
}
