'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Check, ChevronRight, Rocket, 
  Target, Zap, Layout, X 
} from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  content: React.ReactNode;
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isCompleted = localStorage.getItem('onboarding_completed');
    if (!isCompleted) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to HireFlow",
      description: "Let's get you set up in 3 minutes. Your institutional hiring layer is ready.",
      icon: Sparkles,
      content: (
        <div className="flex flex-col items-center gap-6 py-8">
            <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="h-32 w-32 bg-slate-900 rounded-[3rem] flex items-center justify-center shadow-2xl"
            >
                <Rocket className="h-14 w-14 text-[#c8ff00]" />
            </motion.div>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 w-12 rounded-full ${i === 1 ? 'bg-[#c8ff00]' : 'bg-slate-200'}`} />
                ))}
            </div>
        </div>
      )
    },
    {
      title: "Create Your First Job",
      description: "Define what you're looking for. We've pre-filled a modern tech role for you.",
      icon: Target,
      content: (
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl w-full">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Internal Template</div>
            <div className="text-sm font-black text-slate-900 mb-4 text-left">Senior Software Engineer (Full Stack)</div>
            <div className="space-y-2">
                <div className="h-2 w-full bg-slate-200 rounded-full" />
                <div className="h-2 w-2/3 bg-slate-200 rounded-full" />
                <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
            </div>
        </div>
      )
    },
    {
        title: "The Parsing Engine",
        description: "Experience the speed of our OCR and AI parsing engine. Watch your candidate come to life.",
        icon: Zap,
        content: (
          <div className="relative h-48 w-full bg-slate-900 rounded-[2rem] overflow-hidden flex items-center justify-center">
              <motion.div 
                initial={{ y: 0 }}
                animate={{ y: [0, 48, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-b from-[#c8ff00]/20 to-transparent"
              />
              <div className="text-white text-xs font-mono opacity-50">
                [SYSTEM] Parsing sample_resume.pdf...<br/>
                [AI] Skills extracted: React, Node, Kafka<br/>
                [DB] Candidate node created.
              </div>
          </div>
        )
    },
    {
        title: "Hiring Pipeline",
        description: "Your dashboard is built for velocity. Track every candidate across custom stages.",
        icon: Layout,
        content: (
            <div className="grid grid-cols-3 gap-2 w-full">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-white border border-slate-100 rounded-xl p-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full mb-10" />
                        <div className="h-4 w-4 bg-slate-50 rounded-md" />
                    </div>
                ))}
            </div>
        )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem('onboarding_completed', 'true');
    }
  };

  const skipOnboarding = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-950 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-12 text-center"
        >
          <button 
            onClick={skipOnboarding}
            className="absolute top-8 right-8 p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Step {currentStep + 1} of {steps.length}</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{step.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">{step.description}</p>
          </div>

          <div className="flex-1 flex items-center justify-center mb-12">
            {step.content}
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={nextStep}
              className="w-full py-5 bg-slate-900 dark:bg-[#c8ff00] dark:text-slate-900 text-white rounded-3xl text-sm font-black flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
                onClick={skipOnboarding}
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
                Skip for now
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
