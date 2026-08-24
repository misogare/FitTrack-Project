import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';
import dashboardPreview from '../assets/dashboard-preview.png';

import {
  Zap, Rocket, Play, Check, BarChart3, Activity,
  Dumbbell, Apple, Trophy, Bell, Shield, ChevronRight,
  User, UserPlus, Star, X
} from 'lucide-react';


/* inline social icons (lucide has no brand icons) */
const TwitterIcon = (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const InstagramIcon = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
const FacebookIcon = (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;

/* simple SVG substitutes for icons Lucide doesn't have */
const Stopwatch = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const ListChecks = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>;
const Droplet = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-6.2C15.5 7.5 13 3 12 3S8.5 7.5 6 8.8C4 11.1 3 13 3 15a7 7 0 0 0 7 7z"/></svg>;
export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar publicPage />


      {/* ═══════════════ HERO ═══════════════ */}
      <section id="about" className="w-full border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-20 md:flex-row">
          <div className="flex flex-1 flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-500">
              <Check className="h-3 w-3 text-neutral-400" /> Trusted by 50,000+ fitness enthusiasts
            </span>
            <h1 className="text-5xl leading-tight tracking-tight text-black">
              Track Your Fitness.<br />
              <span className="text-neutral-400">Achieve Your Goals.</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-neutral-500">
              FitTrack is your all-in-one platform for activity logging, workout planning, nutrition tracking, and progress analytics — built for serious wellness enthusiasts.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Link to="/register" className="flex items-center gap-2 rounded bg-black px-6 py-3 text-sm !text-white transition hover:bg-neutral-800">
                <Rocket className="h-4 w-4" /> Get Started Free
              </Link>
              <a href="#how-it-works" className="flex items-center gap-2 rounded border border-neutral-300 px-6 py-3 text-sm text-neutral-700 transition hover:bg-neutral-50">
                <Play className="h-4 w-4" /> See How It Works
              </a>
            </div>
            <div className="mt-4 flex items-center gap-8 border-t border-neutral-100 pt-4">
              <div className="flex flex-col"><span className="text-xl text-black">50K+</span><span className="text-xs text-neutral-400">Active Users</span></div>
              <div className="h-8 w-px bg-neutral-200" />
              <div className="flex flex-col"><span className="text-xl text-black">1.2M+</span><span className="text-xs text-neutral-400">Workouts Logged</span></div>
              <div className="h-8 w-px bg-neutral-200" />
              <div className="flex flex-col"><span className="text-xl text-black">98%</span><span className="text-xs text-neutral-400">Satisfaction Rate</span></div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
              <img
                src={dashboardPreview}
                alt="FitTrack dashboard preview"
                className="h-72 w-full object-cover object-top"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-xs text-white">
                <Zap className="h-3 w-3" /> Live dashboard preview
              </span>
            </div>
            <div className="flex gap-3">
              {[
                { icon: Activity, label: 'Calories Burned', value: '2,480 kcal' },
                { icon: Zap, label: 'Steps Today', value: '8,340' },
                { icon: Droplet, label: 'Water Intake', value: '1.8 L' },
              ].map((s) => (
                <div key={s.label} className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-300">
                    <s.icon className="h-4 w-4 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">{s.label}</p>
                    <p className="text-sm text-black">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ VALUE PROPOSITION ═══════════════ */}
      <section className="w-full border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <p className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Why FitTrack?</p>
          <h2 className="mb-3 text-3xl text-black">Everything you need in one place</h2>
          <p className="mx-auto max-w-xl text-sm text-neutral-500">
            Stop juggling multiple apps. FitTrack unifies your fitness journey — from planning to progress — in a single, clean interface.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: Activity, title: 'Smart Workout Plans', text: 'Get personalized workout routines based on your goals, fitness level, and available equipment.' },
              { icon: Apple, title: 'Nutrition Tracking', text: 'Log meals, track macros, and get insights into your dietary habits to fuel your performance.' },
              { icon: BarChart3, title: 'Progress Analytics', text: 'Visualize trends, track milestones, and stay motivated with data-driven progress reports.' },
            ].map((f) => (
              <div key={f.title} className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-6 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-black">{f.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="w-full border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Platform Features</p>
            <h2 className="mb-3 text-3xl text-black">Built for every part of your wellness journey</h2>
            <p className="mx-auto max-w-xl text-sm text-neutral-500">A comprehensive suite of tools designed to keep you consistent, accountable, and progressing.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              { icon: Stopwatch, title: 'Activity Tracking', text: 'Log runs, walks, cycling, and custom activities. View daily, weekly, and monthly activity summaries with visual breakdowns.' },
              { icon: ListChecks, title: 'Custom Workout Plans', text: 'Create and save multi-week training programs. Schedule rest days, set reps and sets, and track completion.' },
              { icon: Apple, title: 'Meal & Macro Logger', text: 'Search a food database, log meals per time of day, and monitor carbs, proteins, and fats against your daily targets.' },
              { icon: Trophy, title: 'Goals & Milestones', text: 'Set weight loss, muscle gain, or endurance goals. Earn badges and milestones as you hit personal records.' },
              { icon: Bell, title: 'Smart Reminders', text: 'Set workout, hydration, and meal reminders. Stay consistent with intelligent nudges based on your schedule.' },
              { icon: Shield, title: 'Privacy & Security', text: 'Your data stays yours. Control visibility settings, manage connected devices, and export your health data anytime.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-xl border border-neutral-100 p-5 transition hover:shadow-sm">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <f.icon className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h4 className="mb-1 text-sm text-black">{f.title}</h4>
                  <p className="text-xs leading-relaxed text-neutral-500">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
     <section id="how-it-works" className="w-full border-b border-neutral-200 bg-neutral-50">
  <div className="mx-auto max-w-7xl px-6 py-16 text-center">
    <p className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Getting Started</p>
    <h2 className="mb-3 text-3xl text-black">Up and running in 3 simple steps</h2>
    <p className="mx-auto mb-12 max-w-md text-sm text-neutral-500">No complex setup. Start tracking your fitness in under 5 minutes.</p>
    
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {[
        { n: '1', title: 'Create Your Account', text: 'Sign up with your email in seconds. Set your fitness goals and baseline information to personalize your experience.' },
        { n: '2', title: 'Log Your Activities', text: 'Record workouts, meals, and daily activity. Use the dashboard to get a complete picture of your wellness each day.' },
        { n: '3', title: 'Track Your Progress', text: 'View analytics, milestone achievements, and trend graphs. Adjust your plan based on data-backed insights.' },
      ].map((s, i) => (
        <div 
          key={s.n} 
          className={`flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6 text-center ${
            i === 0 ? 'md:col-start-1 md:row-start-1' : 
            i === 1 ? 'md:col-start-3 md:row-start-1' : 
                      'md:col-start-2 md:row-start-2'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg ${i === 2 ? 'border-transparent bg-black text-white' : 'border-black text-black'}`}>
            {s.n}
          </div>
          <h4 className="text-black">{s.title}</h4>
          <p className="text-xs leading-relaxed text-neutral-500">{s.text}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="w-full border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Testimonials</p>
            <h2 className="text-3xl text-black">What our users say</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { stars: 5, text: "FitTrack completely changed how I approach fitness. Having everything in one dashboard is a game-changer.", name: 'Alex M.', role: 'Marathon Runner', seed: '1023' },
              { stars: 5, text: "The nutrition tracking is incredibly intuitive. I finally understand where my calories are coming from.", name: 'Priya S.', role: 'Yoga Instructor', seed: '5874' },
              { stars: 4, text: "Progress analytics keep me accountable. Seeing my trends week by week motivates me to push harder.", name: 'Jordan T.', role: 'Strength Athlete', seed: '3421' },
            ].map((t) => (
              <div key={t.name} className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < t.stars ? 'fill-neutral-400 text-neutral-400' : 'text-neutral-300'}`} />
                  ))}
                </div>
                <p className="text-sm italic text-neutral-600">"{t.text}"</p>
                <div className="mt-auto flex items-center gap-3">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${t.seed}`} className="h-9 w-9 rounded-full bg-neutral-200" alt="User" />
                  <div>
                    <p className="text-xs text-black">{t.name}</p>
                    <p className="text-xs text-neutral-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="w-full border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <p className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Pricing</p>
          <h2 className="mb-3 text-3xl text-black">Simple, transparent pricing</h2>
          <p className="mx-auto mb-10 max-w-md text-sm text-neutral-500">Start for free. Upgrade when you're ready for advanced analytics and premium features.</p>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 text-left">
              <div><h4 className="text-base text-black">Free</h4><p className="mt-0.5 text-xs text-neutral-400">For beginners</p></div>
              <p className="text-3xl text-black">$0<span className="text-sm text-neutral-400">/mo</span></p>
              <ul className="flex flex-col gap-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> Activity Logging (basic)</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> 1 Workout Plan</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> Nutrition Tracker (limited)</li>
                <li className="flex items-center gap-2"><X className="h-3 w-3 text-neutral-300" /> <span className="text-neutral-300">Advanced Analytics</span></li>
              </ul>
              <Link to="/register" className="mt-auto block rounded border border-neutral-300 py-2 text-center text-sm text-neutral-700 transition hover:bg-neutral-50">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col gap-4 rounded-xl border border-black bg-black p-6 text-left">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-neutral-300 bg-white px-3 py-0.5 text-xs text-black">Most Popular</span>
              <div><h4 className="text-base text-white">Pro</h4><p className="mt-0.5 text-xs text-neutral-400">For serious athletes</p></div>
              <p className="text-3xl text-white">$9<span className="text-sm text-neutral-400">/mo</span></p>
              <ul className="flex flex-col gap-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-white" /> Unlimited Activity Logging</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-white" /> Unlimited Workout Plans</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-white" /> Full Nutrition Tracker</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-white" /> Advanced Analytics</li>
              </ul>
              <Link to="/register" className="mt-auto block rounded bg-white py-2 text-center text-sm text-black transition hover:bg-neutral-100">Start Free Trial</Link>
            </div>

            {/* Team */}
            <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 text-left">
              <div><h4 className="text-base text-black">Team</h4><p className="mt-0.5 text-xs text-neutral-400">For coaches & groups</p></div>
              <p className="text-3xl text-black">$29<span className="text-sm text-neutral-400">/mo</span></p>
              <ul className="flex flex-col gap-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> Up to 10 Members</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> Coach Dashboard</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-black" /> Priority Support</li>
              </ul>
              <Link to="/register" className="mt-auto block rounded border border-neutral-300 py-2 text-center text-sm text-neutral-700 transition hover:bg-neutral-50">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="w-full bg-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
            <Zap className="h-6 w-6 text-black" />
          </div>
          <h2 className="max-w-xl text-4xl leading-tight text-white">Start your fitness journey today — it's free.</h2>
          <p className="max-w-md text-sm text-neutral-400">Join over 50,000 users who are already tracking smarter, eating better, and achieving more with FitTrack.</p>
          <div className="mt-2 flex items-center gap-3">
            <Link to="/register" className="flex items-center gap-2 rounded bg-white px-7 py-3 text-sm text-black transition hover:bg-neutral-100">
              <UserPlus className="h-4 w-4" /> Create Free Account
            </Link>
            <Link to="/login" className="flex items-center gap-2 rounded border border-neutral-600 px-7 py-3 !text-white text-sm text-neutral-300 transition hover:border-neutral-400 hover:text-white">
              <User className="h-4 w-4" /> Log In
            </Link>
          </div>
          <p className="mt-1 text-xs text-neutral-600">No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="w-full border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-5">
            <div className="flex flex-col gap-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-black">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm text-black">FitTrack</span>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-neutral-500">
                A comprehensive fitness and wellness tracking system. Built for university System Analysis and Design documentation.
              </p>
              <div className="mt-1 flex items-center gap-3">
                <a href="#" className="flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-400 transition hover:border-neutral-400 hover:text-black"><TwitterIcon className="h-3 w-3" /></a>
                <a href="#" className="flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-400 transition hover:border-neutral-400 hover:text-black"><InstagramIcon className="h-3 w-3" /></a>
                <a href="#" className="flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-400 transition hover:border-neutral-400 hover:text-black"><FacebookIcon className="h-3 w-3" /></a>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h5 className="mb-1 text-xs uppercase tracking-widest text-black">Product</h5>
              <a href="#features" className="text-xs text-neutral-500 transition hover:text-black">Features</a>
              <a href="#pricing" className="text-xs text-neutral-500 transition hover:text-black">Pricing</a>
              <span className="text-xs text-neutral-500">Changelog</span>
              <span className="text-xs text-neutral-500">Roadmap</span>
            </div>
            <div className="flex flex-col gap-2">
              <h5 className="mb-1 text-xs uppercase tracking-widest text-black">Pages</h5>
              <Link to="/dashboard" className="text-xs text-neutral-500 transition hover:text-black">Dashboard</Link>
              <Link to="/workouts" className="text-xs text-neutral-500 transition hover:text-black">Activity Tracking</Link>
              <Link to="/nutrition" className="text-xs text-neutral-500 transition hover:text-black">Nutrition</Link>
              <Link to="/analytics" className="text-xs text-neutral-500 transition hover:text-black">Analytics</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h5 className="mb-1 text-xs uppercase tracking-widest text-black">Legal</h5>
              <Link to="/settings" className="text-xs text-neutral-500 transition hover:text-black">Privacy Policy</Link>
              <span className="text-xs text-neutral-500">Terms of Service</span>
              <span className="text-xs text-neutral-500">Cookie Policy</span>
              <span className="text-xs text-neutral-500">Contact</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-6 md:flex-row">
            <p className="text-xs text-neutral-400">© 2026 FitTrack. All rights reserved. · Victoria University</p>
            <span className="inline-flex items-center gap-1.5 rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-400">
              <ChevronRight className="h-3 w-3 text-neutral-300" /> Fittrack v1.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}