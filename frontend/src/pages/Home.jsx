import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Briefcase,
  Target,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Users,
} from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';

const Home = () => {
  return (
    <div className="space-y-12 sm:space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
            <span>Mobile-First • Agentic AI Recruitment</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Land your next dream role with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
              Agentic AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The next-generation hiring platform connecting ambitious talent with top companies.
            Powered by deterministic Job Match Scores, resume intelligence, and mobile-first pipelines.
          </p>

          {/* Touch-first action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-md">
                <Search className="w-5 h-5 mr-2" />
                Explore Opportunities
              </Button>
            </Link>

            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Hire Talent
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto border-t border-slate-200/80">
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">92%</p>
              <p className="text-xs text-slate-500 font-medium">Match Accuracy</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">4x</p>
              <p className="text-xs text-slate-500 font-medium">Faster Hiring</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
              <p className="text-xs text-slate-500 font-medium">Mobile Optimized</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <Badge variant="brand" className="mb-2">Core Capabilities</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Built for seamless hiring from any screen
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Deterministic Match Score</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Transparent 5-pillar scoring (Skills 40%, Experience 20%, Semantic 20%, Projects 10%, Preferences 10%) so you always know why you match.
            </p>
          </Card>

          <Card hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Mobile-First Workflows</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Apply in 1-tap, review candidates with swipeable cards, and manage Kanban pipelines comfortably on your phone.
            </p>
          </Card>

          <Card hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Strict Privacy & RBAC</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Resumes remain private or application-only. Recruiters only access verified candidate data with full audit logging.
            </p>
          </Card>
        </div>
      </section>

      {/* Role Comparison Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Card */}
          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 p-6 sm:p-8">
            <Badge variant="brand" className="mb-3">For Candidates</Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Accelerate Your Career</h3>
            <ul className="space-y-3 mb-6 text-sm text-slate-600">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Upload multiple resumes with Cloudinary secure storage</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Instant skill gap analysis and deterministic match breakdown</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Real-time status tracking from Applied to Offer</span>
              </li>
            </ul>
            <Link to="/register">
              <Button variant="primary" className="w-full sm:w-auto">
                Create Free Candidate Profile
              </Button>
            </Link>
          </Card>

          {/* Recruiter Card */}
          <Card className="bg-gradient-to-br from-white to-brand-50/40 border-brand-200/80 p-6 sm:p-8">
            <Badge variant="purple" className="mb-3">For Recruiters</Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Hire The Right Fit Faster</h3>
            <ul className="space-y-3 mb-6 text-sm text-slate-600">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Publish jobs with structured skill criteria and salary details</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Mobile-responsive Kanban pipeline from review to offer</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Integrated interview scheduling and candidate status updates</span>
              </li>
            </ul>
            <Link to="/register">
              <Button variant="secondary" className="w-full sm:w-auto">
                Start Recruiting
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
