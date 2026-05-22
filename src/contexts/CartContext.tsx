import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  prepTime: number;
  image_url: string;
}

interface CartState {
  items: CartItem[];
  orderType: 'sur_place' | 'emporter';
  specialInstructions: string;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setOrderType: (type: 'sur_place' | 'emporter') => void;
  setSpecialInstructions: (instructions: string) => void;
  total: () => number;
  totalItems: () => number;
  maxPrepTime: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'sur_place',
  specialInstructions: '',

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),

  clearCart: () => set({ items: [], specialInstructions: '' }),

  setOrderType: (orderType) => set({ orderType }),

  setSpecialInstructions: (specialInstructions) => set({ specialInstructions }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  maxPrepTime: () =>
    Math.max(0, ...get().items.map((i) => i.prepTime)),
}));
