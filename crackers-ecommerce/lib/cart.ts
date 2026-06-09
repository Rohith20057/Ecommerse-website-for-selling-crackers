import type { CartItem } from "./types"

export const cartItems: CartItem[] = [
  {
    id: "1",
    name: "Sparkle Fountain",
    description: "A beautiful fountain of colorful sparks that lasts for 30 seconds.",
    price: 199,
    originalPrice: 249,
    discount: 20,
    image: "/placeholder.svg?height=300&width=300",
    inStock: true,
    quantity: 2,
  },
  {
    id: "3",
    name: "Color Smoke Bombs",
    description: "Pack of 5 smoke bombs in different colors. Great for photography.",
    price: 299,
    originalPrice: 349,
    discount: 14,
    image: "/placeholder.svg?height=300&width=300",
    inStock: true,
    quantity: 1,
  },
]
