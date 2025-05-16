export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  inStock: boolean
}

export interface CartItem extends Product {
  quantity: number
}
