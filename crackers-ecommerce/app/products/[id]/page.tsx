"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { products } from "@/lib/products"

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id) || products[0]
  const [quantity, setQuantity] = useState(1)

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const addToCart = () => {
    toast({
      title: "Added to cart",
      description: `${quantity} ${product.name} has been added to your cart.`,
    })
  }

  return (
    <div className="container px-4 py-8 md:px-6">
      <Button variant="outline" size="sm" className="mb-8" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to products
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          {product.discount && <Badge className="absolute left-2 top-2 bg-orange-500">{product.discount}% OFF</Badge>}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-orange-500">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
            )}
          </div>

          <Badge className={product.inStock ? "w-fit bg-green-500" : "w-fit bg-red-500"}>
            {product.inStock ? "In Stock" : "Out of Stock"}
          </Badge>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-4">Quantity</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button variant="outline" size="icon" onClick={incrementQuantity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                size="lg"
                onClick={addToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">Features</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>High-quality materials</li>
              <li>Safe to use</li>
              <li>Vibrant colors and effects</li>
              <li>Long-lasting performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
