export type TestimonialFrame = {
  id: number;
  name: string;
  price: number;
  image_path: string | null;
};

export type TestimonialItem = {
  id: number;
  rating: number;
  emoji: string | null;
  name: string | null;
  message: string | null;
  created_at: string;
  frame: TestimonialFrame | null;
};
