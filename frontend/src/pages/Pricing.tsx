import { Check } from 'lucide-react';

const tiers = [
  { name: 'Starter', price: '0', features: ['5 AI Posters / month', 'Instagram Integration', 'Standard Resolution', 'Manual Posting'], button: 'Get Started' },
  { name: 'Pro', price: '29', features: ['50 AI Posters / month', 'All Social Platforms', 'HD Quality (Imagen 3)', 'EventBridge Scheduling', 'Priority Support'], button: 'Start Free Trial', highlighted: true },
  { name: 'Scale', price: '99', features: ['Unlimited AI Posters', 'Multi-Cloud Backup', 'Custom Watermarking', 'API Access', 'Account Manager'], button: 'Contact Sales' },
];

const Pricing = () => (
  <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h1 className="text-5xl font-black mb-4">Simple, Scalable Pricing</h1>
      <p className="text-gray-500">Choose the plan that fits your social growth needs.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-8">
      {tiers.map((tier) => (
        <div key={tier.name} className={`p-10 rounded-3xl border ${tier.highlighted ? 'border-purple-500 shadow-xl scale-105 bg-white relative' : 'border-gray-100 bg-white'}`}>
          {tier.highlighted && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Most Popular</span>}
          <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
          <div className="mb-6"><span className="text-4xl font-bold">${tier.price}</span><span className="text-gray-500">/mo</span></div>
          <ul className="space-y-4 mb-8">
            {tier.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500" /> {f}
              </li>
            ))}
          </ul>
          <button className={`w-full py-4 rounded-xl font-bold transition-all ${tier.highlighted ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
            {tier.button}
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default Pricing;