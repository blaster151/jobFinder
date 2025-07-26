// Encouragement Quote JSON Format
export interface Encouragement {
  id: string;
  quote: string;
  author: string;
  tags: string[];
}

export const Encouragements: Encouragement[] = [
  {
    id: "low-mood-01",
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    tags: ["resilience"]
  },
  {
    id: "progress-01",
    quote: "Little by little, one travels far.",
    author: "J.R.R. Tolkien",
    tags: ["momentum"]
  },
  {
    id: "impostor-01",
    quote: "You are not late. You're just not early.",
    author: "Kevin Kelly",
    tags: ["comparison", "self-doubt"]
  },
  {
    id: "possibility-01",
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
    tags: ["possibility", "low-mood", "overwhelm"]
  }
]; 