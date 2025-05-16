import { Mail, MapPin, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  return (
    <div className="container px-4 py-12 md:px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl">
          Have questions about our products or need assistance with your order? We're here to help!
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <CardTitle>Phone</CardTitle>
            <CardDescription>Call us directly</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium">Uday Kiran Naik</p>
            <p className="text-muted-foreground">+91 7093243828</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <CardTitle>Email</CardTitle>
            <CardDescription>Send us an email</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium">Customer Support</p>
            <p className="text-muted-foreground">info@crackersforyou.com</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <CardTitle>Address</CardTitle>
            <CardDescription>Visit our store</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium">Crackers for you</p>
            <p className="text-muted-foreground">
              123 Festival Street, Celebration City
              <br />
              Andhra Pradesh, India - 500001
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Your email" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Message subject" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message" className="min-h-32" />
              </div>

              <div className="sm:col-span-2">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">Send Message</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
