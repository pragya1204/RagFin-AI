import Image from 'next/image'; // *** IMPORT ADDED ***

export default function ProductPreview() {
  return (
    // Optional: Add an ID if you want to link to this section, e.g., id="how-it-works"
    <section id="how-it-works" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-20"> {/* Added mb-20 for spacing */}
       <h2 className="text-3xl font-bold text-center mb-12">
          See RagFin AI in Action
        </h2>
      <div className="relative rounded-lg overflow-hidden border border-border shadow-xl"> {/* Adjusted shadow/border */}
        {/* Optional gradient overlay */}
        {/* <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-accent/10 to-transparent" /> */}

        {/* --- IMPORTANT: Replace placeholder image --- */}
        <Image
          src="/images/ragfin-dashboard-preview.png" // <<<=== REPLACE with actual path to your RagFin AI preview image
          alt="RagFin AI Dashboard and Chat Interface Preview" // <<<=== Updated Alt Text
          width={1200}
          height={750} // Adjusted height potentially
          className="w-full h-auto"
        />
         {/* --- END Replace placeholder image --- */}

      </div>
      {/* Optional: Keep glow effect if desired */}
      {/* <div className="absolute -inset-x-20 top-0 h-[500px] bg-gradient-conic opacity-30 blur-3xl -z-10" /> */}
    </section>
  );
}

