import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    priceDesc: "/forever",
    features: [
      "Basic AI Chat Q&A",
      "Core Dashboard View",
      "Manual Data Entry",
      "Standard Security",
      "Community Support",
    ],
    cta: "Get Started Free",
    variant: "outline", // Outline style for free tier
  },
  {
    name: "Premium",
    price: "$15", // Example price - adjust as needed
    priceDesc: "/month",
    features: [
      "Advanced AI Guidance (RAG)",
      "Full Personalized Dashboard",
      "Automated Data Sync (Plaid)",
      "Document Upload (OCR)",
      "Proactive Alerts & Reminders",
      "Priority Email Support",
    ],
    cta: "Go Premium",
    variant: "default", // Default primary style for main paid tier
    popular: true, // Optional flag for styling the popular plan
  },
  {
    name: "Business / API",
    price: "Custom",
    priceDesc: "",
    features: [
      "All Premium Features",
      "API Access for Integration",
      "Dedicated Support Manager",
      "Custom Onboarding",
      "Volume Discounts",
    ],
    cta: "Contact Sales",
    variant: "outline", // Outline style
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/40"> {/* Adjusted background */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Choose the Right Plan for You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"> {/* Added items-stretch */}
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-card p-8 rounded-lg border shadow-sm flex flex-col ${plan.popular ? 'border-primary border-2' : 'border'}`} // Highlight popular plan
            >
              {plan.popular && (
                 <div className="text-sm font-semibold text-primary text-center mb-2">MOST POPULAR</div> // Popular badge
              )}
              <h3 className="text-2xl font-bold mb-4 text-card-foreground">{plan.name}</h3>
              <p className="text-4xl font-bold mb-1 text-card-foreground">
                {plan.price}
              </p>
              <p className="text-sm font-normal text-muted-foreground mb-6">{plan.priceDesc}</p>

              <ul className="mb-8 space-y-2 flex-grow"> {/* Added flex-grow */}
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start"> {/* Changed to items-start */}
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" /> {/* Adjusted icon alignment */}
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-auto" variant={plan.variant as any}> {/* Added mt-auto */}
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

