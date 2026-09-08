import { Zap, Search, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

const features = [
  { icon: Zap, title: "Flexibilité maximale", desc: "Adaptez vos ressources à la hausse ou à la baisse selon vos objectifs. Le freelance, c'est l'agilité." },
  { icon: Search, title: "Jusqu'à -50% sur vos coûts", desc: "Un freelance dédié pour un tarif journalier fixe. Plus de frais cachés, plus de surprises." },
  { icon: BarChart3, title: "Experts qualifiés", desc: "Chaque freelance est évalué et noté. Bénéficiez des meilleurs profils du marché, spécialisés par secteur." },
];

const FeaturesSection = () => {
  return (
    <section className="relative overflow-hidden px-4 py-20" style={{ background: 'linear-gradient(135deg, #faf6f0 0%, #f3ead9 50%, #ecdcc2 100%)' }}>
      <div className="pointer-events-none absolute -right-20 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full border border-primary/10" />
      <div className="container mx-auto max-w-5xl">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-14 text-center font-heading text-3xl font-bold sm:text-4xl">
          Pourquoi choisir <span className="text-primary">Kistone</span> ?
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
              className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 font-heading text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
