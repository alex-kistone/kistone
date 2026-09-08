import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

interface StatItem {
  value: string;
  label: string;
}

const DynamicStatsSection = () => {
  const [stats, setStats] = useState<StatItem[]>([
    { value: "—", label: "freelances actuellement disponibles" },
    { value: "—", label: "missions réalisées" },
    { value: "—", label: "des besoins pourvus" },
    { value: "—", label: "note moyenne des freelances" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("landing-stats");
        if (error) throw error;

        const d = data as {
          available_freelancers: number;
          missions_completed: number;
          fulfillment_rate: number;
          avg_rating: number;
        };

        setStats([
          {
            value: d.available_freelancers > 0 ? `${d.available_freelancers}` : "700+",
            label: "freelances actuellement disponibles",
          },
          {
            value: d.missions_completed > 0 ? `${d.missions_completed}+` : "200+",
            label: "missions réalisées",
          },
          {
            value: d.fulfillment_rate > 0 ? `${d.fulfillment_rate}%` : "95%",
            label: "des besoins pourvus",
          },
          {
            value: d.avg_rating > 0 ? `${d.avg_rating}/5` : "4.8/5",
            label: "note moyenne des freelances",
          },
        ]);
      } catch {
        // Keep fallback values
        setStats([
          { value: "700+", label: "freelances actuellement disponibles" },
          { value: "200+", label: "missions réalisées" },
          { value: "95%", label: "des besoins pourvus" },
          { value: "4.8/5", label: "note moyenne des freelances" },
        ]);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="border-t px-4 py-16" style={{ background: '#111111' }}>
      <div className="container mx-auto max-w-5xl">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mb-12 text-center font-heading text-3xl font-bold text-white"
        >
          Le premier réseau de freelances qualifiés
        </motion.h2>
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="text-center"
            >
              <p className="font-heading text-4xl font-bold" style={{ color: '#e8825a' }}>{value}</p>
              <p className="mt-2 text-sm text-white/70">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamicStatsSection;
