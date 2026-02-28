import { Shield, Zap, BarChart3 } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
    <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform`}>
      <Icon size={28} className={color} />
    </div>
    <h3 className="text-2xl font-black text-slate-900">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
  </div>
);

export default function Features() {
  const features = [
    {
      icon: Shield,
      title: "Secure & Safe",
      description: "Built with the latest Instagram Graph API standards to keep your account safe and compliant.",
      color: "text-blue-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant replies to comments and DMs, ensuring you never miss a lead or engagement opportunity.",
      color: "text-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Powerful Insights",
      description: "Track growth, transmission trends, and registered contacts in real-time with our dashboard.",
      color: "text-purple-600"
    }
  ];

  return (
    <section className="grid md:grid-cols-3 gap-8 mt-40">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </section>
  );
}
