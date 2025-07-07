"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  Play,
  FileText,
  Users,
  Zap,
} from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface SupportTicket {
  id: string
  subject: string
  status: "open" | "pending" | "resolved"
  created: string
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const faqItems: FAQItem[] = [
    {
      id: "1",
      question: "How do I add a new screen to my account?",
      answer:
        "To add a new screen, go to the Screens section in your dashboard and click 'Add Screen'. You'll receive a pairing code that you can enter on your display device.",
      category: "screens",
    },
    {
      id: "2",
      question: "What file formats are supported for media uploads?",
      answer:
        "We support common image formats (JPG, PNG, GIF), video formats (MP4, MOV, AVI), and document formats (PDF). Maximum file size is 100MB per file.",
      category: "media",
    },
    {
      id: "3",
      question: "How do I create and schedule playlists?",
      answer:
        "Navigate to the Playlists section, click 'Create Playlist', add your media files, and set the display duration for each item. You can then assign the playlist to specific screens.",
      category: "playlists",
    },
    {
      id: "4",
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes, you can change your plan at any time from the Billing section. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle.",
      category: "billing",
    },
    {
      id: "5",
      question: "What happens if my screen goes offline?",
      answer:
        "If a screen goes offline, it will continue displaying the last received content. You'll receive notifications about the offline status, and the screen will automatically reconnect when the connection is restored.",
      category: "screens",
    },
  ]

  const supportTickets: SupportTicket[] = [
    {
      id: "1",
      subject: "Screen not connecting after setup",
      status: "open",
      created: "2 days ago",
    },
    {
      id: "2",
      subject: "Playlist not updating on display",
      status: "pending",
      created: "1 week ago",
    },
    {
      id: "3",
      subject: "Billing question about storage limits",
      status: "resolved",
      created: "2 weeks ago",
    },
  ]

  const categories = [
    { id: "all", name: "All Topics", count: faqItems.length },
    { id: "screens", name: "Screens", count: faqItems.filter((item) => item.category === "screens").length },
    { id: "media", name: "Media", count: faqItems.filter((item) => item.category === "media").length },
    { id: "playlists", name: "Playlists", count: faqItems.filter((item) => item.category === "playlists").length },
    { id: "billing", name: "Billing", count: faqItems.filter((item) => item.category === "billing").length },
  ]

  const filteredFAQs = faqItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Find answers to common questions or get in touch with our support team</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Book className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium">Documentation</h3>
            <p className="text-sm text-gray-600">Complete guides and tutorials</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Play className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium">Video Tutorials</h3>
            <p className="text-sm text-gray-600">Step-by-step video guides</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium">Live Chat</h3>
            <p className="text-sm text-gray-600">Chat with our support team</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-medium">Community</h3>
            <p className="text-sm text-gray-600">Connect with other users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Frequently Asked Questions</span>
              </CardTitle>
              <CardDescription>Find quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name} ({category.count})
                  </Button>
                ))}
              </div>

              {/* FAQ Items */}
              <div className="space-y-3">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No results found for your search.</p>
                    <p className="text-sm">Try different keywords or browse all topics.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Can't find what you're looking for? Send us a message</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="Brief description of your issue" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Describe your issue in detail..." rows={4} />
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Support Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Your Support Tickets</CardTitle>
              <CardDescription>Track your recent support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{ticket.created}</p>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                  </div>
                ))}

                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  View All Tickets
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>Other ways to reach our support team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-gray-500">support@digitalsignage.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Phone Support</p>
                  <p className="text-xs text-gray-500">1-800-SIGNAGE (Mon-Fri 9AM-6PM)</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  System Status
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Feature Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
