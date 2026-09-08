import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

const testimonials = [
  {
    quote: "En 48H nous avions 3 profils qualifiés. Le matching est impressionnant de pertinence, nous avons lancé la mission dans la semaine.",
    name: "Marie D.",
    role: "DRH",
    company: "Scale-up Tech (200 pers.)",
    rating: 5,
  },
  {
    quote: "Kistone m'a permis d'accéder à des missions passionnantes sans aucune charge administrative. Le suivi est impeccable.",
    name: "Thomas R.",
    role: "Freelance",
    company: "5 ans d'expérience",
    rating: 5,
  },
  {
    quote: "La qualité des profils proposés est remarquable. Les freelances comprennent nos enjeux tech et s'intègrent immédiatement à nos équipes.",
    name: "Sophie L.",
    role: "VP People",
    company: "Groupe SaaS B2B",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="relative overflow-hidden border-t px-4 py-20" style={{ background: 'linear-gradient(180deg, #f3ead9 0%, #ecdcc2 50%, #faf6f0 100%)' }}>
      <div className="pointer-events-none absolute -left-16 top-20 h-[250px] w-[250px] rounded-full border border-[#c2410c]/25" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-[200px] w-[200px] rounded-full border border-primary/10" />
      <div className="container mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="mb-4 text-center">
          <motion.p variants={fadeUp} className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Témoignages
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl font-bold sm:text-4xl">
            Ils nous font <span className="text-primary">confiance</span>
          </motion.h2>
        </motion.div>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Clients et freelances témoignent de leur expérience avec Kistone.
        </motion.p>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
              className="relative flex flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              <Quote className="mb-3 h-6 w-6 text-primary/30" />
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground italic">
                "{t.quote}"
              </p>
              <div className="mt-4 border-t pt-4">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
