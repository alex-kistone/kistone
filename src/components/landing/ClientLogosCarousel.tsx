import northwaveLogo from "@/assets/clients-new/northwave.png";
import aurelisLogo from "@/assets/clients-new/aurelis.png";
import koviraLogo from "@/assets/clients-new/kovira.png";
import luminaLogo from "@/assets/clients-new/lumina.png";
import finvestLogo from "@/assets/clients-new/finvest.png";
import meridianLogo from "@/assets/clients-new/meridian.png";
import alturaLogo from "@/assets/clients-new/altura.png";
import vexelLogo from "@/assets/clients-new/vexel.png";

const clients = [
  { name: "Northwave", logo: northwaveLogo },
  { name: "Aurelis", logo: aurelisLogo },
  { name: "Kovira", logo: koviraLogo },
  { name: "Lumina Studio", logo: luminaLogo },
  { name: "Finvest", logo: finvestLogo },
  { name: "Meridian", logo: meridianLogo },
  { name: "Altura", logo: alturaLogo },
  { name: "Vexel", logo: vexelLogo },
];

// Double the list for seamless infinite scroll
const doubled = [...clients, ...clients];

const ClientLogosCarousel = () => {
  return (
    <section className="border-t py-10 overflow-hidden" style={{ background: 'linear-gradient(180deg, #faf6f0 0%, #f3ead9 100%)' }}>
      <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Ils nous font confiance
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#faf6f0] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f3ead9] to-transparent" />

        <div className="flex animate-scroll-x items-center gap-12 whitespace-nowrap">
          {doubled.map((client, i) => (
            <img
              key={`${client.name}-${i}`}
              src={client.logo}
              alt={client.name}
              className="h-14 w-auto max-w-[180px] object-contain opacity-70 transition-opacity hover:opacity-100"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientLogosCarousel;
