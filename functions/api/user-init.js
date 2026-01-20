// functions/user-init.js
export async function onRequestPost(context) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
        const body = await context.request.json();
        
        if (!body.id) {
            return Response.json({
                success: false,
                error: 'Telegram ID is required'
            }, {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 1. Проверяем существующего пользователя
        const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${body.id}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const existingUsers = await checkResponse.json();

        // 2. Если пользователь существует - возвращаем его
        if (existingUsers && existingUsers.length > 0) {
            const user = existingUsers[0];
            
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
                user: user,
                exists: true
            }, {
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 3. Создаем нового пользователя
        const newUser = {
            telegram_id: body.id.toString(),
            username: body.username || 'Гость',
            first_name: body.first_name || '',
            last_name: body.last_name || '',
            photo_url: body.photo_url || '',
            balance: 100,
            coins: 0,
            spin_count: 0,
            win_count: 0,
            jackpots: 0,
            join_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const createResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify([newUser])
            }
        );

        const createdUsers = await createResponse.json();
        const createdUser = createdUsers[0];
        createdUser.gifts = [];

        return Response.json({
            success: true,
            user: createdUser,
            exists: false
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('user-init error:', error);
        
        return Response.json({
            success: false,
            error: error.message
        }, {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// Обработка CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}