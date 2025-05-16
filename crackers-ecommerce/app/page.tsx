import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import ProductCard from "@/components/product-card"
import { products } from "@/lib/products"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with contact info */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-2xl text-orange-500">Crackers for you</span>
            </Link>
            <span className="ml-2 text-sm text-muted-foreground">crackers at low prices</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link
                href="/contact"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
              <Link href="/cart">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    0
                  </span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Welcome to Crackers for you
              </h1>
              <p className="mx-auto max-w-[700px] text-lg md:text-xl">
                Celebrate festivals with our premium quality crackers at affordable prices
              </p>
            </div>
            <div className="space-x-4">
              <Button className="bg-white text-orange-500 hover:bg-gray-100">Shop Now</Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/20">
                View Offers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container px-4 py-12 md:px-6">
        <div className="flex flex-col items-start gap-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-auto">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:gap-8">
          <div className="flex-1 space-y-4">
            <div className="text-xl font-medium">Crackers for you</div>
            <p className="text-sm text-muted-foreground">
              Quality crackers for all your celebrations at affordable prices.
            </p>
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-lg font-medium">Contact Information</div>
            <p className="text-sm text-muted-foreground">
              Name: Uday Kiran Naik
              <br />
              Contact: 7093243828
              <br />
              Email: info@crackersforyou.com
            </p>
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-lg font-medium">Quick Links</div>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/products" className="hover:underline">
                Products
              </Link>
              <Link href="/cart" className="hover:underline">
                Cart
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </nav>
          </div>
        </div>
        <div className="border-t py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2025 Crackers for you. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
