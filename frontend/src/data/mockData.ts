export interface Listing {
  id: string;
  title: string;
  category: 'Item' | 'Service';
  description: string;
  pricePerDay: number;
  image: string;
  author: string;
  authorAvatar: string;
  location: string;
  status: 'Available' | 'Borrowed' | 'Reserved';
  createdAt: string;
}

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Professional DSLR Camera',
    category: 'Item',
    description: 'Perfect for weekend photography. Includes tripod and 2 lenses.',
    pricePerDay: 25,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    author: 'Sarah Johnson',
    authorAvatar: 'https://i.pravatar.cc/150?u=sarah',
    location: 'Maple Ridge',
    status: 'Available',
    createdAt: '2 hrs ago'
  },
  {
    id: '3',
    title: 'Electric Lawn Mower',
    category: 'Item',
    description: 'Easy to use, quiet, and powerful. Battery included.',
    pricePerDay: 15,
    image: 'https://images.unsplash.com/photo-1510529175155-3b9b27275dce?auto=format&fit=crop&q=80&w=800',
    author: 'David Wilson',
    authorAvatar: 'https://i.pravatar.cc/150?u=david',
    location: 'Pine Avenue',
    status: 'Available',
    createdAt: '1 day ago'
  },
  {
    id: '5',
    title: 'Home Office Desk Setup',
    category: 'Item',
    description: 'Sturdy wooden desk with cable management. Perfect for remote work.',
    pricePerDay: 40,
    image: 'https://images.unsplash.com/photo-1518455027359-f3f816b1a238?auto=format&fit=crop&q=80&w=800',
    author: 'Liam Brown',
    authorAvatar: 'https://i.pravatar.cc/150?u=liam',
    location: 'Riverstone',
    status: 'Reserved',
    createdAt: '3 days ago'
  }
];

export const currentUser = {
  name: 'Alex Rivera',
  avatar: 'https://i.pravatar.cc/150?u=alex',
  location: 'Maple Ridge',
  itemsShared: 12,
  itemsBorrowed: 4,
  rating: 4.8
};

export const auth = {
  isLoggedIn: false // Set to false to test redirection
};
