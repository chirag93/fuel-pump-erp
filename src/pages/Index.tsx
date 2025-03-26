
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Droplets,
  ChevronRight,
  ChevronDown,
  Laptop,
  ShieldCheck,
  Users,
  TrendingUp,
  BarChart3,
  Smartphone,
  Zap,
  FileText,
  Clock,
  Truck,
  GaugeCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("fuel-station");
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section with Navbar */}
      <header className="relative bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-hidden">
        {/* Navigation */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <Droplets className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">Fuel Pro 360</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium hover:text-blue-300 transition-colors">
                Features
              </a>
              <a href="#modules" className="text-sm font-medium hover:text-blue-300 transition-colors">
                Modules
              </a>
              <a href="#faq" className="text-sm font-medium hover:text-blue-300 transition-colors">
                FAQ
              </a>
              <Link to="/login" className="text-sm font-medium hover:text-blue-300 transition-colors">
                Login
              </Link>
            </nav>
            
            <div className="flex md:hidden">
              <button className="text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="hidden md:block">
              <Link to="/login">
                <Button className="bg-white text-blue-900 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Transform Your Fuel Station Management
              </h1>
              <p className="text-xl max-w-lg text-blue-100">
                A comprehensive system designed to streamline operations, enhance customer experiences, and improve efficiency at your fuel pump stations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-medium">
                    Get Started
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-800 font-medium">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-lg shadow-2xl overflow-hidden border border-blue-700/30">
                <img 
                  src="/lovable-uploads/d51426e3-7851-4864-be9c-ad91131f2236.png" 
                  alt="Fuel Pro 360 Dashboard" 
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-transparent rounded-lg"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-300 rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto fill-white">
            <path d="M0,96L80,85.3C160,75,320,53,480,64C640,75,800,117,960,117.3C1120,117,1280,75,1360,53.3L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>
      </header>
      
      {/* Clients Section */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 font-medium mb-8">Trusted by fuel stations across the country</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
            {["Indian Oil", "Hindustan Petroleum", "Bharat Petroleum", "Shell", "Reliance Petroleum"].map((client, idx) => (
              <div key={idx} className="flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-700">{client}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Tabs Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Comprehensive Solutions for Every Need</h2>
            <p className="text-xl text-gray-600">
              Designed specifically for fuel station operations, Fuel Pro 360 brings everything you need in one integrated platform.
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              {id: "fuel-station", label: "Fuel Station Management"},
              {id: "customer", label: "Customer Management"},
              {id: "mobile", label: "Mobile Operations"}
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-3 rounded-full text-sm font-medium transition-all",
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Tab 1: Fuel Station Management */}
            {activeTab === "fuel-station" && (
              <>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900">Complete Fuel Station Operations</h3>
                  <p className="text-gray-600">
                    Take control of your fuel station with comprehensive management tools designed for daily operations, stock management, and sales tracking.
                  </p>
                  
                  <ul className="space-y-4">
                    {[
                      {icon: GaugeCircle, title: "Daily Readings Management", desc: "Record and track fuel levels, sales, and reconciliation data on a daily basis."},
                      {icon: Clock, title: "Shift Management", desc: "Manage staff shifts, track performance, and handle shift handovers seamlessly."},
                      {icon: Truck, title: "Tank Unloading", desc: "Monitor fuel deliveries, record unloading, and maintain accurate stock levels."}
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <feature.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{feature.title}</h4>
                          <p className="text-gray-600">{feature.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/login">
                    <Button className="mt-2">
                      Explore Station Management <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1611275484845-52a71f1c4c6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                    alt="Fuel Station Management" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-transparent"></div>
                </div>
              </>
            )}
            
            {/* Tab 2: Customer Management */}
            {activeTab === "customer" && (
              <>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900">Customer & Transactions Management</h3>
                  <p className="text-gray-600">
                    Build better relationships with your customers while efficiently managing sales and transactions with our integrated customer management system.
                  </p>
                  
                  <ul className="space-y-4">
                    {[
                      {icon: Users, title: "Customer Database", desc: "Maintain detailed customer records with vehicles, preferences, and transaction history."},
                      {icon: FileText, title: "Booklet & Indent Management", desc: "Manage indent booklets for corporate customers with proper tracking and accounting."},
                      {icon: BarChart3, title: "Transaction Records", desc: "Record, search, and analyze all transactions with comprehensive filtering options."}
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <feature.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{feature.title}</h4>
                          <p className="text-gray-600">{feature.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/login">
                    <Button className="mt-2">
                      Explore Customer Management <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                    alt="Customer Management Dashboard" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-transparent"></div>
                </div>
              </>
            )}
            
            {/* Tab 3: Mobile Operations */}
            {activeTab === "mobile" && (
              <>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900">Mobile Operations</h3>
                  <p className="text-gray-600">
                    Take your fuel station management on the go with our mobile-optimized interfaces for key operations.
                  </p>
                  
                  <ul className="space-y-4">
                    {[
                      {icon: Smartphone, title: "Mobile-Friendly Interface", desc: "Access critical functions from any device with responsive design."},
                      {icon: Zap, title: "Field Operations", desc: "Record indents, daily readings, and manage shifts directly from mobile devices."},
                      {icon: ShieldCheck, title: "Approval Workflows", desc: "Submit operations for approval with built-in verification system."}
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <feature.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{feature.title}</h4>
                          <p className="text-gray-600">{feature.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/login">
                    <Button className="mt-2">
                      Explore Mobile Operations <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                    alt="Mobile Operations Interface" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-transparent"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Key Benefits Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Benefits of Fuel Pro 360</h2>
            <p className="text-xl text-blue-100">
              Beyond features, our platform delivers real business value to fuel station operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Operational Efficiency",
                desc: "Streamline daily processes, reduce manual errors, and save valuable time with automated workflows.",
                icon: Zap
              },
              {
                title: "Financial Control",
                desc: "Gain complete visibility into sales, expenditures, and reconciliation to optimize financial performance.",
                icon: TrendingUp
              },
              {
                title: "Customer Satisfaction",
                desc: "Provide faster service, accurate billing, and better overall experience for your customers.",
                icon: Users
              },
              {
                title: "Data Security",
                desc: "Keep your business data secure with enterprise-grade security protocols and access controls.",
                icon: ShieldCheck
              },
              {
                title: "Insightful Analytics",
                desc: "Make data-driven decisions with comprehensive reporting and analytical capabilities.",
                icon: BarChart3
              },
              {
                title: "Seamless Integrations",
                desc: "Connect with your existing tools and systems for a unified operational environment.",
                icon: Laptop
              }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-blue-800 rounded-xl p-8 shadow-lg border border-blue-700/40 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center mb-6">
                  <benefit.icon className="h-6 w-6 text-blue-200" />
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-blue-100">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Get answers to common questions about Fuel Pro 360.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            {[
              {
                question: "How easy is it to get started with Fuel Pro 360?",
                answer: "Getting started is simple. After signing up, our team will help you set up your account, configure your fuel types and pumps, and provide training to your staff. Most businesses are fully operational within days."
              },
              {
                question: "Can I access the system from multiple devices?",
                answer: "Yes, Fuel Pro 360 is cloud-based and can be accessed from any device with an internet connection. We also offer dedicated mobile interfaces for field operations."
              },
              {
                question: "How does the indent booklet system work?",
                answer: "Our indent booklet system allows you to issue booklets to corporate customers, track usage, and automatically generate invoices. Each indent is validated, recorded, and linked to the customer account for seamless tracking."
              },
              {
                question: "Is my data secure with Fuel Pro 360?",
                answer: "Absolutely. We implement enterprise-grade security protocols, regular backups, and strict access controls to ensure your business data remains secure and confidential at all times."
              },
              {
                question: "Can I track fuel inventory and stock levels?",
                answer: "Yes, Fuel Pro 360 provides comprehensive inventory management features including daily tank readings, stock level monitoring, and alerts for low stock situations."
              }
            ].map((faq, idx) => (
              <div key={idx} className="py-6">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                    <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                    <span className="transition group-open:rotate-180">
                      <ChevronDown className="h-5 w-5 text-blue-500" />
                    </span>
                  </summary>
                  <p className="text-gray-600 mt-3 group-open:animate-fadeIn">
                    {faq.answer}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Fuel Station?</h2>
            <p className="text-xl mb-10 text-blue-100">
              Join hundreds of fuel stations already using Fuel Pro 360 to streamline operations, enhance customer experiences, and drive growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8">
                  Get Started Today
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-800 px-8">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Droplets className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">Fuel Pro 360</span>
              </div>
              <p className="max-w-xs">
                Comprehensive fuel station management solution for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Features</h3>
              <ul className="space-y-2">
                {[
                  "Daily Readings",
                  "Shift Management",
                  "Customer Management",
                  "Transaction Records",
                  "Indent Booklets",
                  "Mobile Operations"
                ].map((item, idx) => (
                  <li key={idx}>
                    <a href="#features" className="hover:text-blue-300 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                {[
                  "About Us",
                  "Contact",
                  "Privacy Policy",
                  "Terms of Service"
                ].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="hover:text-blue-300 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li>support@fuelpro360.com</li>
                <li>+91 123 456 7890</li>
                <li>Mumbai, India</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} Fuel Pro 360. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {["Facebook", "Twitter", "LinkedIn", "Instagram"].map((social, idx) => (
                <a key={idx} href="#" className="hover:text-blue-300 transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
