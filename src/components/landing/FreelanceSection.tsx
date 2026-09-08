import { Link } from "react-router-dom";
import { Zap, Users, BarChart3, CheckCircle2, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

const benefits = [
  { icon: Zap, title: "Missions qualifiées", desc: "Recevez des opportunités adaptées à votre expertise sectorielle et vos disponibilités." },
  { icon: Users, title: "Communauté de 700+ experts", desc: "Rejoignez le plus grand réseau de freelances qualifiés en France." },
  { icon: BarChart3, title: "Visibilité accrue", desc: "Votre profil est présenté directement aux entreprises via notre matching intelligent." },
  { icon: CheckCircle2, title: "Zéro admin", desc: "Contractualisation, facturation et suivi de mission entièrement pris en charge." },
];

const FreelanceSection = () => {
  return (
    <section className="relative overflow-hidden border-t px-4 py-20" style={{ background: 'linear-gradient(135deg, #faf6f0 0%, #f3ead9 40%, #ecdcc2 100%)' }}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-[300px] w-[300px] rounded-full border border-[#c2410c]/20" />
      <div className="container mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="mb-4 text-center">
          <motion.p variants={fadeUp} className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Espace freelance</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl font-bold sm:text-4xl">
            Freelance ? <span className="text-primary">Rejoignez le réseau</span>
          </motion.h2>
        </motion.div>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mb-14 max-w-2xl text-center text-muted-foreground">
          Accédez à des missions qualifiées et développez votre activité en toute sérénité.
        </motion.p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
              className="group rounded-2xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-heading font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4} className="mt-10 text-center">
          <Button asChild size="lg" variant="outline" className="gap-2 rounded-full border-primary px-6 text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/register">Rejoindre le réseau <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FreelanceSection;
