export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAt?: number;
  category: string; // category slug
  categoryLabel?: string;
  images: string[];
  duration: string;
  isCustomized: boolean;
  badge?: string;
};

export type CategoryDTO = {
  id: string;
  slug: string;
  label: string;
  blurb?: string;
};
