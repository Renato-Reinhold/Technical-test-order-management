package com.order.management.backend.scheduler;

import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderItem;
import com.order.management.backend.model.OrderStatus;
import com.order.management.backend.model.Product;
import com.order.management.backend.repository.OrderRepository;
import com.order.management.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderTransactionManager {

    private static final Logger logger = LoggerFactory.getLogger(OrderTransactionManager.class);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderTransactionManager(OrderRepository orderRepository,
                                   ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    @CacheEvict(value = {"orders", "order", "ordersByStatus", "products", "product"}, allEntries = true)
    public boolean processOrderInTransaction(Order order) {
        boolean stockAvailable = validateAndReserveStock(order);

        if (stockAvailable) {
            order.setStatus(OrderStatus.PROCESSING);
            orderRepository.save(order);
            logger.info("Order #{} moved to PROCESSING - stock validated and reserved", order.getId());
            return true;
        } else {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            logger.warn("Order #{} moved to CANCELLED - insufficient stock", order.getId());
            return false;
        }
    }

    private boolean validateAndReserveStock(Order order) {
        logger.debug("Validating stock for order #{}", order.getId());

        // Primeiro, valida se há estoque para todos os itens
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElse(null);

            if (product == null) {
                logger.error("Product #{} not found for order #{}", 
                           item.getProduct().getId(), order.getId());
                return false;
            }

            if (product.getStockQuantity() < item.getQuantity()) {
                logger.warn("Insufficient stock for product '{}' (ID: {}): required={}, available={}", 
                          product.getName(), product.getId(), 
                          item.getQuantity(), product.getStockQuantity());
                return false;
            }
        }

        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow();

            int newStock = product.getStockQuantity() - item.getQuantity();
            product.setStockQuantity(newStock);
            productRepository.save(product);

            logger.debug("Stock reserved for product '{}' (ID: {}): {} units (new stock: {})", 
                       product.getName(), product.getId(), 
                       item.getQuantity(), newStock);
        }

        return true;
    }
}
