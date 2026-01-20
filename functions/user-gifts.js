// functions/user-gifts.js
export async function onRequestPost(context) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
        const body = await context.request.json();
        const { userId, gift_id } = body;

        if (!userId || !gift_id) {
            return Response.json({
                success: false,
                error: 'User ID and Gift ID are required'
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

        // 2. Проверяем, не куплен ли уже подарок
        const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/gifts?user_id=eq.${user.id}&gift_id=eq.${gift_id}&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        const existingGifts = await checkResponse.json();

        if (existingGifts && existingGifts.length > 0) {
            return Response.json({
                success: false,
                error: 'Подарок уже куплен'
            }, {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 3. Добавляем подарок
        const giftResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/gifts`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify([{
                    user_id: user.id,
                    gift_id: gift_id,
                    purchased_at: new Date().toISOString()
                }])
            }
        );

        const gifts = await giftResponse.json();
        const gift = gifts[0];

        // 4. Обновляем updated_at пользователя
        await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    updated_at: new Date().toISOString()
                })
            }
        );

        return Response.json({
            success: true,
            gift: gift
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('user-gifts error:', error);
        
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