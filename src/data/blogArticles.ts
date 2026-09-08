export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  imageUrl: string;
  sourceUrl: string;
};

export const blogArticles: BlogArticle[] = [];

export const blogCategories = [
  "Tous",
];

