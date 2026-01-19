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
        const { spin_count = 0, win_count = 0, jackpots = 0 } = body;

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

        // Замените весь блок после строки 55:

// Обновляем статистику
const updateData = {
    updated_at: new Date().toISOString()
};

// Добавляем только те поля, которые переданы (инкрементируем)
if (spin_count !== 0) {
    updateData.spin_count = user.spin_count + spin_count;
}
if (win_count !== 0) {
    updateData.win_count = user.win_count + win_count;
}
if (jackpots !== 0) {
    updateData.jackpots = user.jackpots + jackpots;
}

// Логируем что обновляем
console.log('Updating user stats:', {
    userId,
    currentStats: { spin: user.spin_count, win: user.win_count, jackpots: user.jackpots },
    increments: { spin_count, win_count, jackpots },
    updateData
});

const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    //.eq('id', userId)  // Ищем по ВНУТРЕННЕМУ ID (UUID)
    .eq('telegram_id', userId)
    .select()
    .single();

if (updateError) {
    console.error('Supabase update error:', updateError);
    throw updateError;
}

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