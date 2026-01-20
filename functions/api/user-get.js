// functions/user-get.js
export async function onRequestGet(context) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
        const url = new URL(context.request.url);
        const userId = url.searchParams.get('id');

        if (!userId) {
            return Response.json({
                success: false,
                error: 'User ID is required'
            }, {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Пробуем найти по telegram_id
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

        // Если не нашли по telegram_id, пробуем по id (UUID)
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

        // Получаем подарки пользователя
        const giftsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/gifts?user_id=eq.${user.id}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        const gifts = await giftsResponse.json();
        user.gifts = gifts || [];

        return Response.json({
            success: true,
            user: user
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('user-get error:', error);
        
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}