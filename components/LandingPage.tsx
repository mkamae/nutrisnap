import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import Progress from './ui/Progress';
import { Trophy, Salad, ChartBar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthView from './AuthView';

const Section: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <section className={`px-6 md:px-8 py-14 md:py-20 ${className || ''}`}>{children}</section>
);

const Card: React.FC<React.PropsWithChildren<{ title?: string; icon?: React.ReactNode }>> = ({ title, icon, children }) => (
  <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-xl p-6 border border-white/40 dark:border-gray-800">
    {icon && <div className="mb-4 text-green-600">{icon}</div>}
    {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
    <p className="text-gray-600 dark:text-gray-300">{children}</p>
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white">
      {/* Hero */}
      <Section className="relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Nutrisnap – Your Nutrition, Simplified.
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Track meals, see progress, and stay motivated with gamification.
          </p>
          <div className="mt-10 max-w-md mx-auto">
            {/* Inline authentication to simplify flow */}
            <AuthView onLogin={() => navigate('/')} />
          </div>
        </motion.div>
        {/* subtle shapes */}
        <motion.div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-green-500/10 blur-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} />
        <motion.div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-400/10 blur-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} />
      </Section>

      {/* Features */}
      <Section>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card title="Log Meals Instantly" icon={<Salad className="w-7 h-7" />}>
              Snap, save, and move on. Nutrisnap keeps logging painless so you can stay consistent.
            </Card>
            <Card title="AI Reports" icon={<ChartBar className="w-7 h-7" />}>
              Clear insights and trends that help you course-correct and celebrate wins.
            </Card>
            <Card title="Gamified Experience" icon={<Trophy className="w-7 h-7" />}>
              Earn points, unlock badges, and keep your streak alive.
            </Card>
          </div>
        </div>
      </Section>

      {/* Gamification Preview */}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Level Up Your Health</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Hit your next level in no time. Here’s how close you are:</p>
          <Progress value={72} />
          <p className="mt-2 text-sm text-gray-500">72% towards Level 8</p>
        </div>
      </Section>

      {/* Testimonials */}
      <Section>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <img className="w-10 h-10 rounded-full" src="https://i.pravatar.cc/100?img=1" alt="avatar" />
                <div>
                  <p className="font-semibold">Alex</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Designer</p>
                </div>
              </div>
              “The streaks and badges kept me logging even on busy days.”
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <img className="w-10 h-10 rounded-full" src="https://i.pravatar.cc/100?img=2" alt="avatar" />
                <div>
                  <p className="font-semibold">Sam</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Engineer</p>
                </div>
              </div>
              “Charts made it obvious when I needed to dial in protein.”
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <img className="w-10 h-10 rounded-full" src="https://i.pravatar.cc/100?img=3" alt="avatar" />
                <div>
                  <p className="font-semibold">Maya</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
                </div>
              </div>
              “It feels premium without getting in my way.”
            </Card>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Try Nutrisnap Today</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Your future self will thank you.</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/')}>Try Nutrisnap Today</Button>
        </div>
        <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-20 h-40 bg-gradient-to-t from-green-500/10 to-transparent" />
      </Section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Nutrisnap</p>
          <nav className="flex gap-6">
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">About</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Contact</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


