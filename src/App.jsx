import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Coursera xAPI Dashboard
          </h1>
          <p className="text-slate-300 mt-2">Environment setup complete! 🚀</p>
        </header>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
          <ul className="space-y-2 text-slate-300">
            <li>✅ Node.js environment configured</li>
            <li>✅ React and Vite installed</li>
            <li>✅ Tailwind CSS configured</li>
            <li>✅ Chart.js and animations ready</li>
            <li>🔄 Ready for xAPI integration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App