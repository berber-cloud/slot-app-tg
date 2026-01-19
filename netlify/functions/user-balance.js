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
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight' }) };
    }

    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        // Получаем ID из query параметров
        const query = event.queryStringParameters || {};
        const userId = query.userId || query.id;
        
        const body = JSON.parse(event.body || '{}');
        const { stars = 0, coins = 0 } = body;

        console.log('💰 user-balance вызван:', { userId, stars, coins });

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

        // Ищем пользователя по telegram_id или UUID
        let user = null;

        // Сначала по telegram_id
        const { data: userByTelegram, error: error1 } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', userId)
            .single();

        // Если не нашли, по id (UUID)
        if (error1 && error1.code === 'PGRST116') {
            console.log('Не найден по telegram_id, пробуем по UUID...');
            const { data: userById, error: error2 } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error2) {
                console.error('❌ Пользователь не найден:', error2.message);
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Пользователь не найден' 
                    })
                };
            }
            user = userById;
        } else if (error1) {
            throw error1;
        } else {
            user = userByTelegram;
        }

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

        console.log('👤 Найден пользователь для обновления баланса:', { 
            id: user.id, 
            telegram_id: user.telegram_id,
            current_balance: user.balance,
            current_coins: user.coins
        });

        // Обновляем баланс
        const newBalance = Math.max(0, (user.balance || 0) + stars);
        const newCoins = Math.max(0, (user.coins || 0) + coins);

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                balance: newBalance,
                coins: newCoins,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Логируем транзакцию
        if (stars !== 0) {
            await supabase.from('transactions').insert([{
                user_id: user.id,
                type: stars > 0 ? 'deposit' : 'withdraw',
                amount: Math.abs(stars),
                currency: 'stars',
                status: 'completed',
                description: stars > 0 ? 'Пополнение баланса' : 'Списание за спин'
            }]);
        }

        if (coins !== 0) {
            await supabase.from('transactions').insert([{
                user_id: user.id,
                type: coins > 0 ? 'deposit' : 'withdraw',
                amount: Math.abs(coins),
                currency: 'coins',
                status: 'completed'
            }]);
        }

        console.log('✅ Баланс обновлен:', { 
            new_balance: newBalance, 
            new_coins: newCoins 
        });

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