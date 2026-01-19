exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Тест параметров Netlify',
            timestamp: new Date().toISOString(),
            allParams: {
                path: event.path,
                rawPath: event.rawPath,
                pathParameters: event.pathParameters,
                queryStringParameters: event.queryStringParameters,
                httpMethod: event.httpMethod,
                headers: event.headers
            }
        }, null, 2)
    };
};