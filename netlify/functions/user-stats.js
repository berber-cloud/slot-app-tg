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

        const query = event.queryStringParameters || {};
        const userId = query.userId || query.id;
        
        const body = JSON.parse(event.body || '{}');
        const { spin_count = 0, win_count = 0, jackpots = 0 } = body;

        console.log('🔧 user-stats вызван:', { userId, spin_count, win_count, jackpots });

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'User ID is required in query: ?userId=...' 
                })
            };
        }

        // Получаем ТЕКУЩИЕ данные пользователя
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('spin_count, win_count, jackpots')
            .or(`telegram_id.eq.${userId},id.eq.${userId}`)
            .single();

        if (fetchError) {
            console.error('❌ Пользователь не найден:', fetchError);
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Пользователь не найден' 
                })
            };
        }

        console.log('📊 Текущая статистика:', {
            spin: currentUser.spin_count,
            win: currentUser.win_count,
            jackpots: currentUser.jackpots
        });

        // Вычисляем НОВЫЕ значения
        const newSpinCount = (currentUser.spin_count || 0) + spin_count;
        const newWinCount = (currentUser.win_count || 0) + win_count;
        const newJackpots = (currentUser.jackpots || 0) + jackpots;

        console.log('📈 Новая статистика:', {
            spin: newSpinCount,
            win: newWinCount,
            jackpots: newJackpots
        });

        const updateData = {
            spin_count: newSpinCount,
            win_count: newWinCount,
            jackpots: newJackpots,
            updated_at: new Date().toISOString()
        };

        // Обновляем пользователя по ID из результата поиска
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .or(`telegram_id.eq.${userId},id.eq.${userId}`)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Ошибка обновления:', updateError);
            throw updateError;
        }

        console.log('✅ Статистика обновлена:', updatedUser);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                user: updatedUser,
                message: 'Статистика обновлена' 
            })
        };

    } catch (error) {
        console.error('💥 Ошибка в user-stats:', error);
        
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