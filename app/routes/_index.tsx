import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { ArrowRight, CreditCard, Share2, Users, FileText, Scan, BarChart3, ShieldCheck, Building2 } from "lucide-react";
import { LandingHeader } from "~/components/LandingHeader";
import { getUser } from "~/utils/session.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const user = await getUser(request, context);
  // For now, hardcode invitation only mode as requested
  const isInvitationOnly = true; 
  return json({ user, isInvitationOnly });
};

export default function Index() {
  const { isInvitationOnly } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <LandingHeader isInvitationOnly={isInvitationOnly} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 flex flex-col items-center text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0F172A] tracking-tight mb-6">
            Your Professional Identity, <br />
            <span className="text-[#06B6D4]">Simplified.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
            Create a stunning digital business card, manage your leads, and share documents with ease. The all-in-one platform for modern professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to={isInvitationOnly ? "/signup" : "/signup"}>
              <Button size="lg" className="bg-[#0F172A] hover:bg-slate-800 text-white px-8 h-14 text-lg">
                {isInvitationOnly ? "Redeem Invitation" : "Create Your Card Now"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {isInvitationOnly && (
              <Button size="lg" variant="outline" className="px-8 h-14 text-lg border-slate-200">
                Contact for Invitation
              </Button>
            )}
            {!isInvitationOnly && (
              <Button size="lg" variant="outline" className="px-8 h-14 text-lg border-slate-200">
                Learn More
              </Button>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#0F172A]/10 rounded-xl flex items-center justify-center mb-6">
                <CreditCard className="text-[#0F172A] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Digital vCard</h3>
              <p className="text-slate-600">Instantly share your contact details with a simple scan or link.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-[#06B6D4] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lead Manager</h3>
              <p className="text-slate-600">Capture and organize leads from manual entry, OCR, or forms.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#0F172A]/10 rounded-xl flex items-center justify-center mb-6">
                <FileText className="text-[#0F172A] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Doc Library</h3>
              <p className="text-slate-600">Securely host and share your professional documents and PDFs.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="text-[#06B6D4] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Sharing</h3>
              <p className="text-slate-600">Dynamic URLs and QR codes for seamless networking everywhere.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="text-[#06B6D4] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Management</h3>
              <p className="text-slate-600">Create and manage digital cards for all employees with centralized control.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#0F172A]/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-[#0F172A] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Brand Control</h3>
              <p className="text-slate-600">Ensure consistent templates and color themes across your organization.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="text-[#06B6D4] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Analytics</h3>
              <p className="text-slate-600">Track scans, shares, and conversions with detailed dashboards.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#0F172A]/10 rounded-xl flex items-center justify-center mb-6">
                <Scan className="text-[#0F172A] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Scan</h3>
              <p className="text-slate-600">High-quality OCR to capture physical business cards reliably.</p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] text-center mb-12">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border bg-slate-50 text-center">
                <div className="w-12 h-12 bg-[#0F172A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#0F172A]" viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h3 className="font-bold text-lg">Scan</h3>
                <p className="text-slate-600 mt-2">Scan QR or tap NFC to open your card instantly.</p>
              </div>
              <div className="p-8 rounded-2xl border bg-slate-50 text-center">
                <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#06B6D4]" viewBox="0 0 24 24" fill="none"><path d="M16 11V7a4 4 0 10-8 0v4M5 11h14v9H5v-9z" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h3 className="font-bold text-lg">Connect</h3>
                <p className="text-slate-600 mt-2">Share links and documents with one tap.</p>
              </div>
              <div className="p-8 rounded-2xl border bg-slate-50 text-center">
                <div className="w-12 h-12 bg-[#0F172A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#0F172A]" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h3 className="font-bold text-lg">Share</h3>
                <p className="text-slate-600 mt-2">Exchange info and grow your network effortlessly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0F172A] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ZanTag Logo" width={32} height={32} className="rounded-lg bg-white/10 p-0.5" />
            <span className="text-xl font-bold">ZanTag</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 ZanTag. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
