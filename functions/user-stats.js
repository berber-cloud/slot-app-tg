// functions/user-stats.js
export async function onRequestPost(context) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
        const body = await context.request.json();
        const { userId, spin_count = 0, win_count = 0, jackpots = 0 } = body;

        if (!userId) {
            return Response.json({
                success: false,
                error: 'User ID is required'
            }, {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 1. Находим пользователя
        let response = await fetch(
            `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${userId}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        let users = await response.json();

        if (!users || users.length === 0) {
            response = await fetch(
                `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );
            users = await response.json();
        }

        if (!users || users.length === 0) {
            return Response.json({
                success: false,
                error: 'Пользователь не найден'
            }, {
                status: 404,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        const user = users[0];

        // 2. Обновляем статистику
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    spin_count: (user.spin_count || 0) + spin_count,
                    win_count: (user.win_count || 0) + win_count,
                    jackpots: (user.jackpots || 0) + jackpots,
                    updated_at: new Date().toISOString()
                })
            }
        );

        const updatedUsers = await updateResponse.json();

        return Response.json({
            success: true,
            user: updatedUsers[0]
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('user-stats error:', error);
        
        return Response.json({
            success: false,
            error: error.message
        }, {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}