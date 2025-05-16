"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const addToCart = () => {
    setIsAddingToCart(true)

    // Simulate adding to cart
    setTimeout(() => {
      setIsAddingToCart(false)
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    }, 500)
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          {product.inStock ? (
            <Badge className="absolute right-2 top-2 bg-green-500">In Stock</Badge>
          ) : (
            <Badge className="absolute right-2 top-2 bg-red-500">Out of Stock</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-500">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
            )}
          </div>
          {product.discount && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              {product.discount}% off
            </Badge>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={addToCart}
          disabled={isAddingToCart || !product.inStock}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        <Button variant="outline" className="flex-shrink-0" asChild>
          <Link href={`/products/${product.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
