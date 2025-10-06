package com.order.management.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger Configuration for API Documentation.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI orderManagementOpenAPI() {
        Server devServer = new Server();
        devServer.setUrl("http://localhost:8080");

        Info info = new Info()
                .title("Order Management API")
                .version("1.0.0")
                .description("""
                    API REST para gerenciamento de pedidos e produtos.
                    
                    ## Scheduler
                    O sistema possui um scheduler que executa a cada 2 minutos para:
                    - Validar estoque disponível
                    - Mover pedidos PENDING para PROCESSING (se houver estoque)
                    - Cancelar pedidos PENDING (se não houver estoque)
                    
                    """);

        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer));
    }
}
