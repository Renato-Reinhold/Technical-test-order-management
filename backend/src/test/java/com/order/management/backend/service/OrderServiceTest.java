package com.order.management.backend.service;

import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderItem;
import com.order.management.backend.model.OrderStatus;
import com.order.management.backend.model.Product;
import com.order.management.backend.repository.OrderRepository;
import com.order.management.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService Unit Tests")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    private Product testProduct;
    private Order testOrder;
    private OrderItem testOrderItem;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Test Product");
        testProduct.setPrice(new BigDecimal("99.99"));
        testProduct.setStockQuantity(100);

        testOrderItem = new OrderItem();
        testOrderItem.setId(1L);
        testOrderItem.setProduct(testProduct);
        testOrderItem.setQuantity(2);

        testOrder = new Order();
        testOrder.setId(1L);
        testOrder.setStatus(OrderStatus.PENDING);
        testOrder.setCreatedAt(LocalDateTime.now());
        testOrder.addItem(testOrderItem);
    }

    @Test
    @DisplayName("Should create order successfully")
    void testCreateOrder() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        List<OrderItem> items = Arrays.asList(testOrderItem);

        Order result = orderService.createOrder(items);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getItems()).hasSize(1);
        verify(productRepository, times(1)).findById(1L);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Should throw exception when product not found")
    void testCreateOrderProductNotFound() {

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        OrderItem invalidItem = new OrderItem();
        Product invalidProduct = new Product();
        invalidProduct.setId(999L);
        invalidItem.setProduct(invalidProduct);
        invalidItem.setQuantity(1);

        List<OrderItem> items = Arrays.asList(invalidItem);

        assertThatThrownBy(() -> orderService.createOrder(items))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Product not found with id: 999");
        verify(productRepository, times(1)).findById(999L);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Should throw exception when insufficient stock")
    void testCreateOrderInsufficientStock() {

        Product lowStockProduct = new Product();
        lowStockProduct.setId(1L);
        lowStockProduct.setName("Low Stock Product");
        lowStockProduct.setStockQuantity(5);

        when(productRepository.findById(1L)).thenReturn(Optional.of(lowStockProduct));

        OrderItem highQuantityItem = new OrderItem();
        highQuantityItem.setProduct(testProduct);
        highQuantityItem.setQuantity(100);

        List<OrderItem> items = Arrays.asList(highQuantityItem);

        assertThatThrownBy(() -> orderService.createOrder(items))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Insufficient stock for product");
        verify(productRepository, times(1)).findById(1L);
        verify(orderRepository, never()).save(any(Order.class));
    }

}
