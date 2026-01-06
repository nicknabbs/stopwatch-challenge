import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import '../App.css' // Reuse styles

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalGames: 0,
        officialWins: 0,
        practiceGames: 0,
        averageTime: 0,
        resets: 0
    })
    const [loading, setLoading] = useState(true)
    const [recentEvents, setRecentEvents] = useState([])

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        if (!import.meta.env.VITE_SUPABASE_URL) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('analytics')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Process Data
            let officialWins = 0
            let totalGames = 0
            let practiceGames = 0
            let totalTime = 0
            let timeCount = 0
            let resets = 0

            data.forEach(event => {
                if (event.event_type === 'GAME_STOP') {
                    totalGames++
                    if (event.metadata?.is_official) {
                        if (event.metadata?.is_win) officialWins++
                    } else {
                        practiceGames++
                    }

                    if (event.metadata?.time_ms) {
                        totalTime += event.metadata.time_ms
                        timeCount++
                    }
                }
                if (event.event_type === 'RESET') {
                    resets++
                }
            })

            setStats({
                totalGames,
                officialWins,
                practiceGames,
                averageTime: timeCount > 0 ? (totalTime / timeCount / 1000).toFixed(2) : 0,
                resets
            })

        } catch (err) {
            console.error('Error fetching stats:', err)
        } finally {
            setLoading(false)
        }
    }

    const barData = {
        labels: ['Official Plays', 'Practice Plays', 'Wins'],
        datasets: [
            {
                label: 'Game Stats',
                data: [
                    stats.totalGames - stats.practiceGames,
                    stats.practiceGames,
                    stats.officialWins
                ],
                backgroundColor: ['#fbbf24', '#a0a0b0', '#4ade80'],
            },
        ],
    }

    return (
        <div className="container" style={{ overflowY: 'auto' }}>
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Analytics Dashboard</h1>
                <button className="btn-reset" onClick={() => window.location.href = '/'}>Back to Game</button>
            </header>

            {loading ? (
                <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading data...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div className="prize-badge">
                            <span className="prize-text">{stats.totalGames}</span>
                            <span className="prize-subtext">Total Games</span>
                        </div>
                        <div className="prize-badge official-attempt">
                            <span className="prize-text">{stats.officialWins}</span>
                            <span className="prize-subtext">Official Wins</span>
                        </div>
                        <div className="prize-badge">
                            <span className="prize-text">{stats.averageTime}s</span>
                            <span className="prize-subtext">Avg Time</span>
                        </div>
                        <div className="prize-badge">
                            <span className="prize-text">{stats.resets}</span>
                            <span className="prize-subtext">Resets</span>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="game-panel" style={{ minHeight: '400px', flexDirection: 'column', padding: '1rem' }}>
                        <Bar options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: { display: true, text: 'Engagement Overview' },
                            },
                        }} data={barData} />
                    </div>

                    {/* Recent Activity Log */}
                    <div className="game-panel" style={{ flexDirection: 'column', padding: '1rem', alignItems: 'flex-start' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#fbbf24' }}>Recent Activity</h3>
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '300px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #4b5563' }}>
                                        <th style={{ padding: '0.5rem' }}>Time</th>
                                        <th style={{ padding: '0.5rem' }}>Event</th>
                                        <th style={{ padding: '0.5rem' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEvents.length === 0 ? (
                                        <tr><td colSpan="3" style={{ padding: '0.5rem', textAlign: 'center', color: '#888' }}>No recent activity</td></tr>
                                    ) : (
                                        recentEvents.map((evt) => (
                                            <tr key={evt.id} style={{ borderBottom: '1px solid #333' }}>
                                                <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                                                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <br />
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(evt.created_at).toLocaleDateString()}</span>
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    {evt.event_type === 'RESET' && (
                                                        <span style={{ color: '#f87171', fontWeight: 'bold' }}>RESET</span>
                                                    )}
                                                    {evt.event_type === 'GAME_STOP' && evt.metadata?.is_win && (
                                                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>WINNER</span>
                                                    )}
                                                    {evt.event_type === 'GAME_STOP' && !evt.metadata?.is_win && (
                                                        <span style={{ color: '#888' }}>Play</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                                                    {evt.event_type === 'RESET' && (
                                                        <span style={{ color: '#fff' }}>By: {evt.metadata?.cashier || 'Unknown'}</span>
                                                    )}
                                                    {evt.event_type === 'GAME_STOP' && (
                                                        <span>
                                                            {evt.metadata?.time_ms}ms
                                                            {evt.metadata?.is_official ? ' (Official)' : ' (Fun)'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!import.meta.env.VITE_SUPABASE_URL && (
                        <div className="prize-badge" style={{ borderColor: '#f87171' }}>
                            <span className="prize-text">DEMO MODE</span>
                            <span className="prize-subtext">Supabase credentials missing. Charts are empty.</span>
                        </div>
                    )}

                </div>
            )}
        </div>
    )
}
