import { Link } from "react-router-dom";
import { ArrowUpRight, Search, Sparkles, CheckCircle2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const matchingSteps = [
  { icon: Search, label: "Décrivez votre besoin", detail: "Tech · Paris · Hybrid" },
  { icon: Sparkles, label: "Notre IA analyse", detail: "Compétences, secteur, remote, TJM…" },
  { icon: CheckCircle2, label: "Profils qualifiés en 48H", detail: "3 freelances disponibles" },
];

const HeroSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 lg:pt-24" style={{ background: 'linear-gradient(135deg, #faf6f0 0%, #f3ead9 40%, #ecdcc2 70%, #e8c9a8 100%)' }}>
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border border-[#c2410c]/30" />
      <div className="pointer-events-none absolute -right-16 top-16 h-[400px] w-[400px] rounded-full border border-[#7a8a5c]/25" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              Le plus grand réseau de freelances qualifiés
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              La plateforme<br />
              <span className="text-primary">Freelance</span><br />
              de référence
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-6 max-w-lg text-lg text-muted-foreground">
              <strong className="text-foreground">700+ freelances qualifiés</strong>.
              Matching intelligent et profils disponibles en <strong className="text-foreground">48H</strong>.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2 rounded-full px-6">
                <Link to="/client">Déposer un besoin <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-6">
                <Link to="/register">Je suis freelance <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Matching animation */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="space-y-4">
              {matchingSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;
                const isDone = i < activeStep;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }}
                    className={`flex items-center gap-4 rounded-2xl border p-5 transition-all duration-500 ${
                      isActive
                        ? "border-primary/40 bg-primary/5 shadow-md"
                        : isDone
                        ? "border-primary/20 bg-card opacity-70"
                        : "border-border bg-card opacity-50"
                    }`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-500 ${
                      isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{step.label}</p>
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.p
                            key={`detail-${i}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-0.5 text-sm text-muted-foreground"
                          >
                            {step.detail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    {isDone && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    {isActive && (
                      <motion.div
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute -top-2 right-0 z-10 flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">
                <span className="text-muted-foreground">Matching</span>{" "}<strong>intelligent IA</strong>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
