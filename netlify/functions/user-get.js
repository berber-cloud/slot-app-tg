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
        // Получаем ID из URL (может быть telegramId или userId)
        const { telegramId } = event.pathParameters || {};
        
        console.log('🔍 user-get вызван с параметром:', telegramId);

        if (!telegramId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'ID is required' 
                })
            };
        }

        // Пробуем найти пользователя разными способами
        let user = null;
        let error = null;

        // Сначала пробуем найти по telegram_id (как число/строка)
        let { data: userByTelegram, error: error1 } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        // Если не нашли по telegram_id, пробуем по id (UUID)
        if (error1 && error1.code === 'PGRST116') {
            console.log('Не найден по telegram_id, пробуем по UUID...');
            const { data: userById, error: error2 } = await supabase
                .from('users')
                .select('*')
                .eq('id', telegramId)  // Здесь telegramId на самом деле может быть UUID
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

        if (user) {
            console.log('✅ Пользователь найден:', { id: user.id, telegram_id: user.telegram_id });
            
            // Получаем подарки пользователя
            const { data: gifts } = await supabase
                .from('gifts')
                .select('*')
                .eq('user_id', user.id);
            
            user.gifts = gifts || [];

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, user })
            };
        }

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