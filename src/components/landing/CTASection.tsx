import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import kistoneLogo from "@/assets/kistone_logo_black.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const CTASection = () => {
  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="px-4 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <motion.img variants={fadeUp} src={kistoneLogo} alt="" className="mx-auto mb-6 h-48 dark:invert" />
        <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl font-bold sm:text-4xl">
          Trouvez vos talents<br />avec la plateforme freelance de référence
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Rejoignez les entreprises qui font confiance à Kistone pour trouver les meilleurs freelances.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2 rounded-full px-6">
            <Link to="/client">Déposer un besoin <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-6">
            <Link to="/register">Rejoindre le réseau <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CTASection;
