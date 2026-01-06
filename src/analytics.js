import { supabase } from './supabaseClient'

export const EVENT_TYPES = {
    GAME_START: 'GAME_START',
    GAME_STOP: 'GAME_STOP',
    RESET: 'RESET',
    VISIT_DASHBOARD: 'VISIT_DASHBOARD'
}

export const logEvent = async (eventType, metadata = {}) => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_KEY) {
        console.warn('Analytics: Supabase credentials missing. Event not logged:', eventType)
        return
    }

    try {
        const { error } = await supabase
            .from('analytics')
            .insert([
                {
                    event_type: eventType,
                    metadata: metadata,
                    created_at: new Date().toISOString()
                }
            ])

        if (error) {
            console.error('Analytics Error:', error)
        }
    } catch (err) {
        console.error('Analytics Exception:', err)
    }
}
