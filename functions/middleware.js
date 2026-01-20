// functions/_middleware.js
export async function onRequest(context) {
    const url = new URL(context.request.url);
    
    // Маршрутизация API
    if (url.pathname.startsWith('/api/')) {
        return handleAPI(context);
    }
    
    // Статические файлы
    return context.next();
}

async function handleAPI(context) {
    const url = new URL(context.request.url);
    const path = url.pathname.replace('/api/', '');
    
    try {
        // Динамический импорт нужной функции
        const module = await import(`./${path}.js`);
        
        // Вызываем соответствующий метод HTTP
        switch (context.request.method) {
            case 'GET':
                return module.onRequestGet?.(context) || 
                       module.onRequest?.(context) ||
                       new Response('Method not allowed', { status: 405 });
                
            case 'POST':
                return module.onRequestPost?.(context) || 
                       module.onRequest?.(context) ||
                       new Response('Method not allowed', { status: 405 });
                
            case 'OPTIONS':
                return new Response(null, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
                
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return Response.json({
            success: false,
            error: 'API endpoint not found'
        }, {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}