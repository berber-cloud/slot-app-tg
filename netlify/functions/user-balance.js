const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight' })
        };
    }

    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        const { userId } = event.pathParameters || {};
        const body = JSON.parse(event.body || '{}');
        const { stars = 0, coins = 0 } = body;

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'User ID is required' 
                })
            };
        }

        // Получаем текущего пользователя
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (!user) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Пользователь не найден' 
                })
            };
        }

        // Обновляем баланс
        const newBalance = Math.max(0, user.balance + stars);
        const newCoins = Math.max(0, user.coins + coins);

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                balance: newBalance,
                coins: newCoins,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Логируем транзакцию
        if (stars !== 0) {
            await supabase.from('transactions').insert([{
                user_id: userId,
                type: stars > 0 ? 'deposit' : 'withdraw',
                amount: Math.abs(stars),
                currency: 'stars',
                status: 'completed'
            }]);
        }

        if (coins !== 0) {
            await supabase.from('transactions').insert([{
                user_id: userId,
                type: coins > 0 ? 'deposit' : 'withdraw',
                amount: Math.abs(coins),
                currency: 'coins',
                status: 'completed'
            }]);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, user: updatedUser })
        };

    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};