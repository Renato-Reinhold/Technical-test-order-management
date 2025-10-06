package com.order.management.backend.dto;

import com.order.management.backend.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDTO {
    private Long id;
    private LocalDateTime createdAt;
    private OrderStatus status;
    private List<OrderItemResponseDTO> items;
    private BigDecimal total;

    public OrderResponseDTO() {}

    public OrderResponseDTO(Long id, LocalDateTime createdAt, OrderStatus status, List<OrderItemResponseDTO> items, BigDecimal total) {
        this.id = id;
        this.createdAt = createdAt;
        this.status = status;
        this.items = items;
        this.total = total;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public List<OrderItemResponseDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponseDTO> items) {
        this.items = items;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}
