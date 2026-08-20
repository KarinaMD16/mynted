export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  rating: number;
  verified: boolean;
}

export interface Value {
  value: string;
}