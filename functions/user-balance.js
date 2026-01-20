// functions/user-balance.js
export async function onRequestPost(context) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
        const body = await context.request.json();
        const { userId, stars = 0, coins = 0 } = body;

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

        // 2. Обновляем баланс
        const newBalance = Math.max(0, (user.balance || 0) + stars);
        const newCoins = Math.max(0, (user.coins || 0) + coins);

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
                    balance: newBalance,
                    coins: newCoins,
                    updated_at: new Date().toISOString()
                })
            }
        );

        const updatedUsers = await updateResponse.json();
        const updatedUser = updatedUsers[0];

        // 3. Логируем транзакцию (если есть изменения)
        if (stars !== 0) {
            await fetch(
                `${SUPABASE_URL}/rest/v1/transactions`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{
                        user_id: user.id,
                        type: stars > 0 ? 'deposit' : 'withdraw',
                        amount: Math.abs(stars),
                        currency: 'stars',
                        status: 'completed',
                        created_at: new Date().toISOString()
                    }])
                }
            );
        }

        if (coins !== 0) {
            await fetch(
                `${SUPABASE_URL}/rest/v1/transactions`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{
                        user_id: user.id,
                        type: coins > 0 ? 'deposit' : 'withdraw',
                        amount: Math.abs(coins),
                        currency: 'coins',
                        status: 'completed',
                        created_at: new Date().toISOString()
                    }])
                }
            );
        }

        return Response.json({
            success: true,
            user: updatedUser
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('user-balance error:', error);
        
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