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

        console.log('👤 Найден пользователь:', { id: user.id, telegram_id: user.telegram_id });

        // Обновляем статистику
        const updateData = {
            spin_count: (user.spin_count || 0) + spin_count,
            win_count: (user.win_count || 0) + win_count,
            jackpots: (user.jackpots || 0) + jackpots,
            updated_at: new Date().toISOString()
        };

        console.log('📝 Обновление статистики:', updateData);

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Ошибка обновления в Supabase:', updateError);
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
                error: error.message,
                details: 'Internal server error' 
            })
        };
    }
};