import { Check, IndianRupee } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    price: '0',
    subtitle: 'For trying VinciFlow',
    features: [
      '5 posts / month',
      'Brand customization',
      'Manual posting',
      'Single brand',
    ],
    button: 'Start Free'
  },
  {
    name: 'Pro',
    price: '499',
    subtitle: 'For growing brands',
    features: [
      '50 posts / month',
      'Brand logo watermark on posts',
      'AI captions + hashtags',
      'Auto scheduling',
      'Integration with Social Platforms',
    ],
    button: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Scale',
    price: '999',
    subtitle: 'For serious growth',
    features: [
      '125 posts / month',
      'All features in Pro',
      'Priority generation',
      'Faster processing',
      'Early access to new features'
    ],
    button: 'Upgrade Now'
  }
];

const Pricing = () => (
  <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
    
    <div className="text-center mb-16">
      <h1 className="text-5xl font-bold mb-4 text-slate-700 font-['Merriweather'] tracking-tight">
        Save 10+ hours/week on content creation
      </h1>
      <p className="text-gray-500 text-lg">
        Start free. Upgrade as your content needs grow.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`p-10 rounded-3xl border transition-all ${
            tier.highlighted
              ? 'border-purple-700 shadow-xl scale-105 bg-white relative'
              : 'border-gray-100 bg-white'
          }`}
        >
          {tier.highlighted && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Most Popular
            </span>
          )}

          <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
          <p className="text-sm text-gray-400 mb-4">{tier.subtitle}</p>

          <div className="mb-6 flex items-end gap-1">
            <IndianRupee size={28} className="text-slate-800 mb-1" />
            <span className="text-4xl font-bold text-slate-900">
              {tier.price}
            </span>
            <span className="text-gray-500 mb-1">/mo</span>
          </div>

          <ul className="space-y-4 mb-8">
            {tier.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <Check size={18} className="text-green-500" />
                {f}
              </li>
            ))}
          </ul>

          <button
            className={`w-full py-4 rounded-xl font-semibold transition-all ${
              tier.highlighted
                ? 'bg-purple-700 text-white hover:bg-purple-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tier.button}
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default Pricing;