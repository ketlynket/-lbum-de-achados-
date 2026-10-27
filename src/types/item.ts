export const CATEGORIES = ['Decoração', 'Moda', 'Casa', 'Beleza', 'Tecnologia', 'Outros'] as const;

export type Category = (typeof CATEGORIES)[number];

export type FindItem = {
  id: string;
  title: string;
  category: Category;
  place: string;
  price: string;
  notes: string;
  imageUri: string | null;
  favorite: boolean;
  createdAt: string;
};
