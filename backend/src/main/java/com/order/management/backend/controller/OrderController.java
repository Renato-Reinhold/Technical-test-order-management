package com.order.management.backend.controller;

import com.order.management.backend.dto.OrderRequestDTO;
import com.order.management.backend.dto.OrderResponseDTO;
import com.order.management.backend.mapper.OrderMapper;
import com.order.management.backend.model.Order;
import com.order.management.backend.model.OrderItem;
import com.order.management.backend.model.OrderStatus;
import com.order.management.backend.model.Product;
import com.order.management.backend.repository.ProductRepository;
import com.order.management.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
@Tag(name = "Orders", description = "API para gerenciamento de pedidos")
public class OrderController {

    private final OrderService orderService;
    private final ProductRepository productRepository;

    public OrderController(OrderService orderService, ProductRepository productRepository) {
        this.orderService = orderService;
        this.productRepository = productRepository;
    }

    @PostMapping
    @Operation(
        summary = "Criar novo pedido",
        description = "Cria um novo pedido com status PENDING. O pedido será processado automaticamente pelo scheduler a cada 2 minutos. Invalida caches de pedidos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Pedido criado com sucesso",
            content = @Content(schema = @Schema(implementation = OrderResponseDTO.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou produto não encontrado")
    })
    public ResponseEntity<Object> createOrder(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        try {
            List<OrderItem> orderItems = new ArrayList<>();
            
            for (var itemDTO : orderRequestDTO.getItems()) {
                Product product = productRepository.findById(itemDTO.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemDTO.getProductId()));
                
                OrderItem orderItem = new OrderItem();
                orderItem.setProduct(product);
                orderItem.setQuantity(itemDTO.getQuantity());
                orderItems.add(orderItem);
            }
            
            Order createdOrder = orderService.createOrder(orderItems);
            OrderResponseDTO responseDTO = OrderMapper.toResponseDTO(createdOrder);
            return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @Operation(
        summary = "Listar pedidos",
        description = "Lista todos os pedidos. Suporta paginação opcional. Resultados são cacheados por 5 minutos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de pedidos retornada com sucesso")
    })
    public ResponseEntity<?> getAllOrders(
            @Parameter(description = "Número da página (começa em 0)", example = "0")
            @RequestParam(required = false) Integer page,
            @Parameter(description = "Tamanho da página", example = "10")
            @RequestParam(required = false) Integer size,
            @Parameter(description = "Campo para ordenação", example = "createdAt")
            @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Direção da ordenação (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDirection) {
        
        if (page != null && size != null) {
            Sort.Direction direction = sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Order> ordersPage = orderService.getAllOrdersPaginated(pageable);
            Page<OrderResponseDTO> responsePage = ordersPage.map(OrderMapper::toResponseDTO);
            return ResponseEntity.ok(responsePage);
        }
        
        List<Order> orders = orderService.getAllOrders();
        List<OrderResponseDTO> responseDTOs = orders.stream()
                .map(OrderMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(responseDTOs);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Buscar pedido por ID",
        description = "Retorna um pedido específico pelo seu ID. Resultado é cacheado por 5 minutos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Pedido encontrado",
            content = @Content(schema = @Schema(implementation = OrderResponseDTO.class))),
        @ApiResponse(responseCode = "404", description = "Pedido não encontrado")
    })
    public ResponseEntity<OrderResponseDTO> getOrderById(
            @Parameter(description = "ID do pedido", required = true, example = "1")
            @PathVariable Long id) {
        try {
            Order order = orderService.getOrderById(id);
            OrderResponseDTO responseDTO = OrderMapper.toResponseDTO(order);
            return ResponseEntity.ok(responseDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    @Operation(
        summary = "Atualizar status do pedido",
        description = "Atualiza o status de um pedido. Status possíveis: PENDING, PROCESSING, CANCELLED."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso",
            content = @Content(schema = @Schema(implementation = OrderResponseDTO.class))),
        @ApiResponse(responseCode = "404", description = "Pedido não encontrado")
    })
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @Parameter(description = "ID do pedido", required = true, example = "1")
            @PathVariable Long id,
            @Parameter(description = "Novo status", required = true, example = "PROCESSING")
            @RequestParam OrderStatus status) {
        try {
            Order updatedOrder = orderService.updateOrderStatus(id, status);
            OrderResponseDTO responseDTO = OrderMapper.toResponseDTO(updatedOrder);
            return ResponseEntity.ok(responseDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/status/{status}")
    @Operation(
        summary = "Listar pedidos por status",
        description = "Retorna todos os pedidos com um status específico. Resultado é cacheado por 3 minutos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de pedidos retornada com sucesso")
    })
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByStatus(
            @Parameter(description = "Status dos pedidos (PENDING, PROCESSING, CANCELLED)", required = true, example = "PENDING")
            @PathVariable OrderStatus status) {
        List<Order> orders = orderService.getOrdersByStatus(status);
        List<OrderResponseDTO> responseDTOs = orders.stream()
                .map(OrderMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(responseDTOs);
    }
}
