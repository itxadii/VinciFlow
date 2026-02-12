const Docs = () => (
  <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
    <div className="flex flex-col md:flex-row gap-12">
      <aside className="w-full md:w-64 space-y-8">
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs text-gray-400 tracking-widest">Introduction</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="text-purple-600 font-semibold cursor-pointer">Getting Started</li>
            <li className="hover:text-purple-600 cursor-pointer">Core Concepts</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs text-gray-400 tracking-widest">API Reference</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="hover:text-purple-600 cursor-pointer">Gemini Integration</li>
            <li className="hover:text-purple-600 cursor-pointer">Webhook Setup</li>
          </ul>
        </div>
      </aside>
      <main className="flex-1">
        <h1 className="text-4xl font-bold mb-6">Getting Started</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Welcome to the VinciFlow developer documentation. VinciFlow is built on a serverless event-driven architecture designed for high-throughput AI media synthesis and social orchestration.
        </p>
        <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm mb-8">
          <p># Initialize your project</p>
          <p className="text-purple-400">npm install @vinciflow/core</p>
        </div>
        <h2 className="text-2xl font-bold mb-4">Architecture Overview</h2>
        <p className="text-gray-600 mb-4">The platform leverages AWS Step Functions to orchestrate the transition from raw text prompts to final social assets stored across S3 and Azure Blob Storage.</p>
      </main>
    </div>
  </div>
);

export default Docs;