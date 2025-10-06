package com.order.management.backend.controller;

import com.order.management.backend.dto.ProductDTO;
import com.order.management.backend.dto.ProductResponseDTO;
import com.order.management.backend.mapper.ProductMapper;
import com.order.management.backend.model.Product;
import com.order.management.backend.service.ProductService;
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

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
@Tag(name = "Products", description = "API para gerenciamento de produtos")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @Operation(
        summary = "Criar novo produto",
        description = "Cria um novo produto no catálogo. Invalida o cache de produtos após criação."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Produto criado com sucesso",
            content = @Content(schema = @Schema(implementation = ProductResponseDTO.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<ProductResponseDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        Product product = ProductMapper.toEntity(productDTO);
        Product createdProduct = productService.createProduct(product);
        ProductResponseDTO responseDTO = ProductMapper.toResponseDTO(createdProduct);
        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(
        summary = "Listar produtos",
        description = "Lista todos os produtos. Suporta paginação opcional. Resultados são cacheados por 15 minutos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de produtos retornada com sucesso")
    })
    public ResponseEntity<?> getAllProducts(
            @Parameter(description = "Número da página (começa em 0)", example = "0")
            @RequestParam(required = false) Integer page,
            @Parameter(description = "Tamanho da página", example = "10")
            @RequestParam(required = false) Integer size,
            @Parameter(description = "Campo para ordenação", example = "name")
            @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Direção da ordenação (asc/desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDirection) {
        
        // Se page e size forem fornecidos, retorna paginado
        if (page != null && size != null) {
            Sort.Direction direction = sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Product> productsPage = productService.getAllProductsPaginated(pageable);
            Page<ProductResponseDTO> responsePage = productsPage.map(ProductMapper::toResponseDTO);
            return ResponseEntity.ok(responsePage);
        }
        
        // Caso contrário, retorna lista completa (comportamento antigo)
        List<Product> products = productService.getAllProducts();
        List<ProductResponseDTO> responseDTOs = products.stream()
                .map(ProductMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(responseDTOs);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Buscar produto por ID",
        description = "Retorna um produto específico pelo seu ID. Resultado é cacheado por 15 minutos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Produto encontrado",
            content = @Content(schema = @Schema(implementation = ProductResponseDTO.class))),
        @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    })
    public ResponseEntity<ProductResponseDTO> getProductById(
            @Parameter(description = "ID do produto", required = true, example = "1")
            @PathVariable Long id) {
        return productService.getProductById(id)
                .map(ProductMapper::toResponseDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Atualizar produto",
        description = "Atualiza um produto existente. Invalida todos os caches de produtos após atualização."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Produto atualizado com sucesso",
            content = @Content(schema = @Schema(implementation = ProductResponseDTO.class))),
        @ApiResponse(responseCode = "404", description = "Produto não encontrado"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<ProductResponseDTO> updateProduct(
            @Parameter(description = "ID do produto", required = true, example = "1")
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        try {
            Product existingProduct = productService.getProductById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            ProductMapper.updateEntityFromDTO(productDTO, existingProduct);
            Product updatedProduct = productService.updateProduct(id, existingProduct);
            ProductResponseDTO responseDTO = ProductMapper.toResponseDTO(updatedProduct);
            return ResponseEntity.ok(responseDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Deletar produto",
        description = "Remove um produto do catálogo. Invalida todos os caches de produtos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Produto deletado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    })
    public ResponseEntity<Void> deleteProduct(
            @Parameter(description = "ID do produto", required = true, example = "1")
            @PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
