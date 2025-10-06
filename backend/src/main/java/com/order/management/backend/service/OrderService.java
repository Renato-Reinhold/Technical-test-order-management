package com.order.management.backend.service;

import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderItem;
import com.order.management.backend.model.OrderStatus;
import com.order.management.backend.model.Product;
import com.order.management.backend.repository.OrderRepository;
import com.order.management.backend.repository.ProductRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @CacheEvict(value = {"orders", "ordersByStatus"}, allEntries = true)
    public Order createOrder(List<OrderItem> items) {
        Order order = new Order();
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + item.getProduct().getId()));

            if (item.getQuantity() > product.getStockQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            order.addItem(item);
        }

        return orderRepository.save(order);
    }

    @Cacheable(value = "orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Page<Order> getAllOrdersPaginated(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    @Cacheable(value = "order", key = "#id")
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    @CacheEvict(value = {"orders", "order", "ordersByStatus"}, allEntries = true)
    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Cacheable(value = "ordersByStatus", key = "#status")
    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }
}
