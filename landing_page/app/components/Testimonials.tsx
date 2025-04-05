const testimonials = [
  {
    quote: "RagFin AI finally made sense of my taxes! The AI chat is incredibly helpful and accurate.",
    author: "Sarah K.",
    title: "Freelance Designer", // Using title instead of company
  },
  {
    quote: "Managing finances used to be stressful. Now, the dashboard keeps me organized and informed. Highly recommend!",
    author: "Michael T.",
    title: "Small Business Owner",
  },
  {
    quote: "I saved so much time uploading documents with the OCR feature. RagFin AI streamlined my entire financial tracking.",
    author: "Elena R.",
    title: "Consultant",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white dark:bg-background"> {/* Adjusted background for light/dark */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Hear From Our Users
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-muted/40 p-6 rounded-lg border"> {/* Adjusted card style */}
              <p className="text-lg mb-4 text-foreground">"{testimonial.quote}"</p>
              <p className="font-semibold text-foreground">{testimonial.author}</p>
              <p className="text-sm text-muted-foreground">{testimonial.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

