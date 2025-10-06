package com.order.management.backend.scheduler;

import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderStatus;
import com.order.management.backend.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OrderProcessingScheduler {

    private static final Logger logger = LoggerFactory.getLogger(OrderProcessingScheduler.class);

    private final OrderRepository orderRepository;
    private final OrderTransactionManager transactionManager;

    public OrderProcessingScheduler(OrderRepository orderRepository,
                                   OrderTransactionManager transactionManager) {
        this.orderRepository = orderRepository;
        this.transactionManager = transactionManager;
    }

    /**
     * Job agendado que executa a cada 2 minutos (120.000 ms).
     * Processa pedidos pendentes validando o estoque.
     */
    @Scheduled(fixedRate = 120000) 
    public void processPendingOrders() {
        logger.info("=== Starting scheduled order processing job at {} ===", LocalDateTime.now());

        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        
        if (pendingOrders.isEmpty()) {
            logger.info("No pending orders to process");
            return;
        }

        logger.info("Found {} pending orders to process", pendingOrders.size());

        int processedCount = 0;
        int cancelledCount = 0;

        for (Order order : pendingOrders) {
            try {
                 
                boolean success = transactionManager.processOrderInTransaction(order);
                if (success) {
                    processedCount++;
                } else {
                    cancelledCount++;
                }
            } catch (Exception e) {
                logger.error("Error processing order #{}: {}", order.getId(), e.getMessage(), e);
                cancelledCount++;
            }
        }

        logger.info("=== Order processing job completed: {} processed, {} cancelled ===", 
                   processedCount, cancelledCount);
    }

    public String getLastExecutionInfo() {
        return "Order Processing Scheduler is active. Runs every 2 minutes to process pending orders.";
    }
}
