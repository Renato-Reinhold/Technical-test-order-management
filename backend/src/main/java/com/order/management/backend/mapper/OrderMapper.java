package com.order.management.backend.mapper;

import com.order.management.backend.dto.OrderItemResponseDTO;
import com.order.management.backend.dto.OrderResponseDTO;
import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderItem;

import java.math.BigDecimal;

public class OrderMapper {

    private OrderMapper() {}

    public static OrderResponseDTO toResponseDTO(Order order) {
        if (order == null) {
            return null;
        }

        var items = order.getItems().stream()
                .map(OrderMapper::toItemResponseDTO)
                .toList();

        BigDecimal total = calculateTotal(order);

        return new OrderResponseDTO(
                order.getId(),
                order.getCreatedAt(),
                order.getStatus(),
                items,
                total
        );
    }

    private static OrderItemResponseDTO toItemResponseDTO(OrderItem item) {
        if (item == null) {
            return null;
        }
        return new OrderItemResponseDTO(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getProduct().getPrice()
        );
    }

    // Calculate order total
    private static BigDecimal calculateTotal(Order order) {
        return order.getItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
