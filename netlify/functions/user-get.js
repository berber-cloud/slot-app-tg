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
        // ВАЖНО: Получаем ID из пути - разные способы для Netlify
        let userId = null;
        
        // Способ 1: Из pathParameters (обычный способ)
        if (event.pathParameters && event.pathParameters.telegramId) {
            userId = event.pathParameters.telegramId;
        }
        // Способ 2: Из queryStringParameters (через ?id=...)
        else if (event.queryStringParameters && event.queryStringParameters.id) {
            userId = event.queryStringParameters.id;
        }
        // Способ 3: Из самого пути (вручную парсим)
        else if (event.path) {
            // Пример пути: /.netlify/functions/user-get/5962149453
            const pathParts = event.path.split('/');
            userId = pathParts[pathParts.length - 1];
            
            // Если это не ID (например, "user-get"), то пробуем предпоследнюю часть
            if (userId === 'user-get' && pathParts.length > 3) {
                userId = pathParts[pathParts.length - 2];
            }
        }

        console.log('🔍 user-get вызван. Путь:', event.path);
        console.log('🔍 Полученный ID:', userId);
        console.log('🔍 Все параметры:', {
            path: event.path,
            pathParameters: event.pathParameters,
            queryStringParameters: event.queryStringParameters,
            rawPath: event.rawPath
        });

        if (!userId || userId === 'user-get') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'ID is required',
                    hint: 'Используйте: /api/user-get/YOUR_ID'
                })
            };
        }

        // ДАЛЕЕ ВАШ КОД ПОИСКА ПОЛЬЗОВАТЕЛЯ...
        // [оставьте весь остальной код без изменений]

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