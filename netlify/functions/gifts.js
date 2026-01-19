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

    const gifts = [
        {
            id: 'gift_1',
            emoji: '🥃',
            name: '50 грамм',
            description: '50 грамм самогона',
            price: 5,
            currency: 'coins',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_2',
            emoji: '🚬',
            name: 'Марльборо',
            description: 'Пачка сигарет для создания дымной завесы',
            price: 10,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_3',
            emoji: '💪',
            name: 'Протеин',
            description: 'Банка протеина для наращивания мышц',
            price: 15,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_4',
            emoji: '💉',
            name: 'Тренболон ацетат',
            description: 'Ампула для настоящих качков',
            price: 20,
            currency: 'coins',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_5',
            emoji: '🔥',
            name: 'Зажигалка',
            description: 'Зажигалка для поджигания отношений',
            price: 8,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_6',
            emoji: '🧪',
            name: 'Колба химика',
            description: 'Пустая колба для экспериментов',
            price: 12,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_7',
            emoji: '🧫',
            name: 'Пробирка',
            description: 'Пробирка для хранения веществ',
            price: 7,
            currency: 'stars',
            category: 'Набор юного химика'
        }
    ];

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, gifts })
    };
};