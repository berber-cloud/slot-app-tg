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
        // Получаем ID из query параметров
        const query = event.queryStringParameters || {};
        const userId = query.id || query.userId || query.telegramId;
        
        console.log('🔍 user-get вызван. Query:', query);
        console.log('🔍 Полученный ID:', userId);

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'ID is required',
                    hint: 'Используйте: /api/user-get?id=YOUR_ID'
                })
            };
        }

        // Поиск пользователя по telegram_id или UUID
        let user = null;
        let error = null;

        // Сначала ищем по telegram_id
        const { data: userByTelegram, error: error1 } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', userId)
            .single();

        // Если не нашли, ищем по id (UUID)
        if (error1 && error1.code === 'PGRST116') {
            console.log('Не найден по telegram_id, пробуем по UUID...');
            const { data: userById, error: error2 } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error2) {
                error = error2;
            } else {
                user = userById;
            }
        } else if (error1) {
            error = error1;
        } else {
            user = userByTelegram;
        }

        if (error) {
            console.error('❌ Ошибка поиска пользователя:', error);
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Пользователь не найден' 
                })
            };
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

        console.log('✅ Пользователь найден:', { 
            id: user.id, 
            telegram_id: user.telegram_id,
            username: user.username 
        });

        // Получаем подарки пользователя
        const { data: gifts, error: giftsError } = await supabase
            .from('gifts')
            .select('id, gift_id, purchased_at')
            .eq('user_id', user.id);

        if (giftsError) {
            console.error('Ошибка загрузки подарков:', giftsError);
            user.gifts = [];
        } else {
            user.gifts = gifts || [];
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, user })
        };

    } catch (error) {
        console.error('💥 Ошибка в user-get:', error);
        
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