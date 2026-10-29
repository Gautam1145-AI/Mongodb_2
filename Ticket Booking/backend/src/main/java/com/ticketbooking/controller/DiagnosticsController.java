package com.ticketbooking.controller;

import com.ticketbooking.dto.ExplainResultDto;
import com.ticketbooking.dto.ReplicaStatusDto;
import com.ticketbooking.service.DiagnosticsService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class DiagnosticsController {

    private final DiagnosticsService diagnosticsService;
    private final MongoTemplate mongoTemplate;

    public DiagnosticsController(DiagnosticsService diagnosticsService, MongoTemplate mongoTemplate) {
        this.diagnosticsService = diagnosticsService;
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Event Ticket Booking System");
        health.put("timestamp", Instant.now().toString());

        try {
            org.bson.Document ping = mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            health.put("database", "CONNECTED");
            health.put("dbPing", ping.get("ok"));
            health.put("databaseName", mongoTemplate.getDb().getName());
        } catch (Exception e) {
            health.put("database", "DISCONNECTED: " + e.getMessage());
            return ResponseEntity.status(503).body(health);
        }

        return ResponseEntity.ok(health);
    }

    @GetMapping("/api/ops/replica-status")
    public ResponseEntity<ReplicaStatusDto> getReplicaStatus() {
        return ResponseEntity.ok(diagnosticsService.getReplicaStatus());
    }

    @GetMapping("/api/ops/query-explain")
    public ResponseEntity<List<ExplainResultDto>> getQueryExplain() {
        return ResponseEntity.ok(diagnosticsService.getExplainPlans());
    }

    @GetMapping("/api/ops/indexes")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getIndexes() {
        return ResponseEntity.ok(diagnosticsService.getIndexInventory());
    }
}

