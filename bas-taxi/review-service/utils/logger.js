import { createLogger, transports, format } from 'winston';
import Elasticsearch from 'winston-elasticsearch';

const esTransportOpts = {
    level: 'info',
    clientOpts: { node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200' },
    indexPrefix: 'review-service-logs',
};

const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new transports.Console(),
        new Elasticsearch(esTransportOpts),
    ],
});

export default logger;
