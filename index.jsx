import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './index.css'

// Pelindung terakhir: tangkap error render apa pun supaya layar tidak pernah
// putih total (blank). Tampilkan pesan + tombol muat ulang, dan log ke console
// agar penyebab sebenarnya tetap bisa didiagnosis.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        console.error('Render error captured by ErrorBoundary:', error, info)
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center">
                        <h1 className="text-lg font-bold text-slate-800 mb-2">Terjadi kesalahan</h1>
                        <p className="text-sm text-slate-500 mb-4">
                            Aplikasi mengalami gangguan saat menampilkan halaman. Silakan muat ulang.
                        </p>
                        <p className="text-xs text-slate-400 mb-4 break-words">
                            {String(this.state.error?.message || this.state.error)}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                            Muat ulang
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
