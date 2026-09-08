import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const steps = [
  { num: "1", title: "Partagez votre besoin", desc: "Définissez votre projet : compétences, durée, budget et périmètre." },
  { num: "2", title: "Matching intelligent", desc: "Notre IA analyse votre besoin et identifie les meilleurs profils disponibles." },
  { num: "3", title: "Shortlist en 48H", desc: "Recevez une sélection de freelances qualifiés et disponibles immédiatement." },
  { num: "4", title: "Lancez la mission", desc: "Kistone gère la contractualisation et le suivi. Concentrez-vous sur l'essentiel." },
];

const StepsSection = () => {
  return (
    <section className="relative overflow-hidden border-t px-4 py-20" style={{ background: 'linear-gradient(180deg, #faf6f0 0%, #ecdcc2 100%)' }}>
      <div className="pointer-events-none absolute -left-24 bottom-0 h-[300px] w-[300px] rounded-full border border-[#c2410c]/25" />
      <div className="container mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mb-4 text-center">
          <motion.h2 variants={fadeUp} className="font-heading text-3xl font-bold sm:text-4xl">
            Du besoin au lancement en <span className="text-primary">48H</span>
          </motion.h2>
        </motion.div>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mb-14 max-w-2xl text-center text-muted-foreground">
          Un process simplifié grâce au matching IA et au plus large réseau de freelances qualifiés.
        </motion.p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ num, title, desc }, i) => (
            <motion.div
              key={num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
              className="group relative"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors group-hover:bg-primary/80">
                {num}
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
