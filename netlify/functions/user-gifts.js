// netlify/functions/user-gifts.js
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
        const { gift_id } = body;

        if (!userId || !gift_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'User ID and Gift ID are required' 
                })
            };
        }

        // Проверяем, не куплен ли уже подарок
        const { data: existingGift } = await supabase
            .from('gifts')
            .select('*')
            .eq('user_id', userId)
            .eq('gift_id', gift_id)
            .single();

        if (existingGift) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Подарок уже куплен' 
                })
            };
        }

        // Добавляем подарок
        const { data: gift, error: giftError } = await supabase
            .from('gifts')
            .insert([{
                user_id: userId,
                gift_id: gift_id,
                purchased_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (giftError) throw giftError;

        // Обновляем updated_at у пользователя
        await supabase
            .from('users')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, gift })
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