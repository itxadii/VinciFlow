import { Instagram, Twitter, Facebook} from 'lucide-react';

const integrations = [
  { name: 'Instagram', desc: 'Direct publishing to Feed and Stories via Meta Graph API.', icon: <Instagram className="text-pink-600" />, status: 'soon' },
  { name: 'Facebook', desc: 'Automated posting for Business Pages and Groups.', icon: <Facebook className="text-blue-600" />, status: 'soon' },
  { name: 'X (Twitter)', desc: 'Instant tweet orchestration with AI-optimized threads.', icon: <Twitter className="text-sky-500" />, status: 'soon' },
];

const Integrations = () => (
  <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h1 className="text-4xl font-bold mb-4">Powerful Integrations</h1>
      <p className="text-gray-500 max-w-2xl mx-auto">VinciFlow connects your AI-generated creativity with the worlds most popular social platforms instantly.</p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 ">
      {integrations.map((item) => (
        <div key={item.name} className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all ">
          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6">{item.icon}</div>
          <h3 className="text-xl font-bold mb-2 font-['Handlee']">{item.name}</h3>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">{item.desc}</p>
          <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">{item.status}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Integrations;