package com.order.management.backend.controller;

import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderStatus;
import com.order.management.backend.repository.OrderRepository;
import com.order.management.backend.scheduler.OrderProcessingScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para testes e monitoramento do scheduler.
 */
@RestController
@RequestMapping("/api/scheduler")
@CrossOrigin(origins = "*")
public class SchedulerTestController {

    private final OrderProcessingScheduler scheduler;
    private final OrderRepository orderRepository;

    public SchedulerTestController(OrderProcessingScheduler scheduler,
                                  OrderRepository orderRepository) {
        this.scheduler = scheduler;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSchedulerInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("status", "active");
        info.put("interval", "2 minutes (120000ms)");
        info.put("description", scheduler.getLastExecutionInfo());
        
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        info.put("currentPendingOrders", pendingOrders.size());
        
        return ResponseEntity.ok(info);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getOrderStats() {
        Map<String, Long> stats = new HashMap<>();
        
        stats.put("PENDING", (long) orderRepository.findByStatus(OrderStatus.PENDING).size());
        stats.put("PROCESSING", (long) orderRepository.findByStatus(OrderStatus.PROCESSING).size());
        stats.put("COMPLETED", (long) orderRepository.findByStatus(OrderStatus.COMPLETED).size());
        stats.put("CANCELLED", (long) orderRepository.findByStatus(OrderStatus.CANCELLED).size());
        stats.put("TOTAL", orderRepository.count());
        
        return ResponseEntity.ok(stats);
    }
}
