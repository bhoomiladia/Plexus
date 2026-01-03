"use client"
import React from "react"
import { motion } from "framer-motion"

interface Feature {
  title: string
  label: string
  desc: string
  icon: string
}

interface FeaturesSectionProps {
  onBack: () => void
}

const FeaturesSection = ({ onBack }: { onBack: () => void }) => {
  const features = [
    {
      title: "Smart Onboarding",
      label: "Phase 01",
      description: "Project owners selectively choose candidates based on fit, not random formation.",
      icon: "◈"
    },
    {
      title: "Talk & Accept",
      label: "Phase 02",
      description: "Integrated 1:1 chat allows owners to discuss goals before final acceptance.",
      icon: "◇"
    },
    {
      title: "Blockchain Ledger",
      label: "Phase 03",
      description: "Immutable record of membership and roles providing verified proof of work.",
      icon: "◎"
    },
    {
      title: "Tamper-Proof History",
      label: "Phase 04",
      description: "Transparent history of collaboration that is verifiable on the resume level.",
      icon: "⊞"
    },
    {
      title: "Auto-Group Genesis",
      label: "Phase 05",
      description: "Collaboration spaces are instantly provisioned upon candidate approval.",
      icon: "⚛"
    },
    {
      title: "Skill-Match Alerts",
      label: "Phase 06",
      description: "Automated notifications bridge the gap between niche projects and skilled contributors.",
      icon: "⨀"
    }
  ]

  return (
    <motion.div
      key="features"
      className="relative z-50 min-h-screen flex items-center justify-center px-4 md:px-8 lg:px-12 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-7xl">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] text-white uppercase mb-3 md:mb-4">
            Features
          </h2>
          <p className="text-neutral-300 text-xs md:text-sm tracking-[0.25em] uppercase font-light">
            Explore the network
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="h-fit bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col"
            >
              <div className="text-3xl md:text-4xl mb-4 text-white/60 group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <div className="text-[9px] md:text-[10px] text-neutral-500 tracking-[0.2em] uppercase mb-2">
                {feature.label}
              </div>
              <h3 className="text-base md:text-lg font-bold text-white tracking-wide uppercase leading-tight mb-6">
                {feature.title}
              </h3>
              <p className="text-neutral-400 text-xs md:text-sm tracking-wide leading-relaxed mt-auto">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onBack}
            className="px-10 md:px-12 py-3.5 md:py-4 rounded-full bg-white/15 text-white uppercase text-[10px] md:text-xs tracking-[0.25em] hover:bg-white hover:text-black transition-all duration-300 border border-white/30 hover:border-white shadow-lg shadow-white/5 hover:shadow-white/20"
          >
            Back to Home
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default FeaturesSection