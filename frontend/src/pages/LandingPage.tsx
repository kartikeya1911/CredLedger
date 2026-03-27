import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Star, ArrowRight, CheckCircle2, Wallet, Code2, Users } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Shield,
    title: '0% Platform Fees',
    desc: 'Keep every penny you earn. Smart contracts handle payments — no middlemen taking 20% cuts.',
    color: 'text-primary-light',
    bg: 'bg-primary/10',
  },
  {
    icon: Zap,
    title: 'Instant Escrow Payouts',
    desc: 'Milestone approved? Funds release instantly to your wallet. No 14-day wait periods.',
    color: 'text-accent-light',
    bg: 'bg-accent/10',
  },
  {
    icon: Star,
    title: 'On-Chain Reputation',
    desc: 'Your work history is immutable. Take your verified ratings anywhere — they belong to you.',
    color: 'text-secondary-light',
    bg: 'bg-secondary/10',
  },
];

const stats = [
  { value: '12,400+', label: 'Active Freelancers' },
  { value: '$2.4M', label: 'Total Escrowed' },
  { value: '0.8s', label: 'Avg Settlement' },
  { value: '99.9%', label: 'Uptime' },
];

const steps = [
  { step: '01', title: 'Post a Job', desc: 'Describe your project, set milestones, and define the budget.', icon: Code2 },
  { step: '02', title: 'Get Proposals', desc: 'Verified freelancers bid with cover letters and portfolio links.', icon: Users },
  { step: '03', title: 'Fund Escrow', desc: 'Deposit funds into a smart contract. 100% secure and transparent.', icon: Wallet },
  { step: '04', title: 'Release on Approval', desc: 'Approve milestones and funds release instantly to the freelancer.', icon: CheckCircle2 },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-sc-bg text-light_text font-sans overflow-x-hidden relative">
      {/* Ambient background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-sc-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="text-lg font-display font-bold text-white">
              Skill<span className="text-primary-light">Chain</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted_text">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-white transition-colors">Network</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted_text hover:text-white transition-colors hidden md:block">
              Sign In
            </Link>
            <Link to="/auth" className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all shadow-glow">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-xs font-semibold uppercase tracking-widest mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live on Ethereum Sepolia
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="font-display font-extrabold text-5xl md:text-7xl !leading-[1.08] tracking-tight mb-6 max-w-4xl mx-auto text-white"
          >
            Freelancing, Secured{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-secondary to-accent">
              by Code.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="max-w-2xl mx-auto text-lg md:text-xl text-muted_text mb-12"
          >
            The decentralized freelance marketplace where smart contracts replace trust issues. 0% fees. Instant payouts. Your reputation, on-chain forever.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/auth"
              className="group px-8 py-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-all shadow-glow-lg flex items-center gap-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              Hire Talent <ArrowRight size={16} />
            </Link>
            <Link
              to="/auth"
              className="px-8 py-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-accent font-semibold text-sm hover:bg-white/[0.1] transition-all flex items-center gap-2"
            >
              Start Earning <Wallet size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary-light text-sm font-semibold uppercase tracking-widest mb-3">Why SkillChain</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white">Built Different. Built Better.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={i}
                variants={fadeUp}
                className="group glass p-8 rounded-2xl hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-muted_text leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-sc-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white">From Post to Payout in 4 Steps</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
                variants={fadeUp}
                className="relative glass p-6 rounded-2xl text-center"
              >
                <div className="text-4xl font-display font-extrabold text-primary/20 mb-2">{s.step}</div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon size={22} className="text-primary-light" />
                </div>
                <h4 className="font-display font-bold text-white mb-2">{s.title}</h4>
                <p className="text-sm text-muted_text">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center"
              >
                <p className="font-display text-3xl md:text-4xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-muted_text mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="glass p-12 md:p-16 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
                Ready to Work Without Middlemen?
              </h2>
              <p className="text-muted_text text-lg mb-8 max-w-xl mx-auto">
                Join thousands of freelancers and clients building the future of work — trustlessly.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all shadow-glow-lg"
              >
                Launch App <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Code2 size={12} className="text-white" />
            </div>
            <span className="text-sm font-display font-semibold text-white">SkillChain</span>
          </div>
          <p className="text-xs text-muted_text">© 2024 SkillChain. Freelancing secured by code.</p>
          <div className="flex items-center gap-6 text-xs text-muted_text">
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Sepolia Explorer</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
