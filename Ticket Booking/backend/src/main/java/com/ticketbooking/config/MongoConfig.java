package com.ticketbooking.config;

import com.mongodb.ReadPreference;
import com.mongodb.WriteConcern;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableMongoAuditing
@EnableScheduling
public class MongoConfig {

    /**
     * MongoTransactionManager enables Spring's @Transactional support
     * over MongoDB multi-document transactions.
     * Note: MongoDB requires a replica set (or Atlas) for transactions.
     */
    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }

    /**
     * Customizes MongoTemplate with default WriteConcern.MAJORITY and ReadPreference.primary
     * for strict consistency in ticketing operations.
     */
    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory dbFactory, MappingMongoConverter converter) {
        MongoTemplate template = new MongoTemplate(dbFactory, converter);
        template.setWriteConcern(WriteConcern.MAJORITY);
        template.setReadPreference(ReadPreference.primary());
        return template;
    }
}

