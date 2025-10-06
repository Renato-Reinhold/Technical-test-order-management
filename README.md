# Technical-test-order-management

Sistema de gerenciamento de pedidos desenvolvido com Angular (frontend) e Spring Boot (backend).

## Início Rápido com Docker

A maneira mais fácil de executar o projeto completo:

```bash
docker-compose up --build
```

Acesse:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

O projeto já vem com **dados de exemplo** prontos:
- 📦 **produtos** em diversas categorias
- 🛒 **pedidos** com diferentes status

---

## 🏛️ Arquitetura do Sistema

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Angular   │      │ Spring Boot │      │ PostgreSQL  │
│  Frontend   │─────▶│   Backend   │─────▶│  Database   │
│  (Port 80)  │ HTTP │ (Port 8080) │ JDBC │  (Port 5432)│
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            │ Cache
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     │   Cache     │
                     │ (Port 6379) │
                     └─────────────┘
```

**Fluxo de Dados:**
1. Frontend Angular faz requisições HTTP para o Backend
2. Backend consulta cache Redis primeiro (se disponível)
3. Se não houver cache, consulta PostgreSQL
4. Scheduler processa pedidos PENDING a cada 2 minutos
5. Cache é invalidado automaticamente em operações de escrita

---

## 🏗️ Tecnologias

### Frontend
- Angular 18
- Tailwind CSS
- TypeScript
- Nginx (produção)

### Backend
- Spring Boot 3.5.6
- Java 17
- PostgreSQL 16
- Redis 7 (cache)
- JPA/Hibernate
- Flyway (migrations)
- Gradle
- Springdoc OpenAPI 3
- JUnit 5 + Mockito (testes)

### DevOps
- Docker
- Docker Compose (4 serviços)
  - `postgres` - Banco de dados PostgreSQL 16
  - `redis` - Cache Redis 7
  - `backend` - API Spring Boot (porta 8080)
  - `frontend` - App Angular com Nginx (porta 80)

## 📁 Estrutura do Projeto

```
Technical-test-order-management/
├── frontend/              # Aplicação Angular
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── backend/              # Aplicação Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/        # Testes unitários e integração
│   ├── build.gradle
│   └── Dockerfile
└── docker-compose.yml    # Orquestração dos serviços
```

## Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- Java 17+
- PostgreSQL 16+
- Docker

### Comandos Principais

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Reconstruir
docker-compose up --build
```

## 📋 Funcionalidades

### Core Features
- ✅ Gerenciamento de produtos (CRUD)
- ✅ Gerenciamento de pedidos
- ✅ Dashboard com estatísticas
- ✅ Filtros e busca
- ✅ Processamento automático de pedidos (scheduler a cada 2 minutos)
- ✅ Validação de dados e estoque

### Infraestrutura e DevOps
- ✅ API RESTful documentada (Swagger/OpenAPI 3.0)
- ✅ Cache com Redis (performance 6.8x mais rápida)
- ✅ Dockerização completa (4 containers)
- ✅ Migrations automáticas com Flyway
- ✅ Testes unitários e de integração (69 testes, 95% sucesso)

## 🗄️ Banco de Dados

O projeto utiliza **Flyway** para gerenciar as migrations do banco de dados:

### Migrations Incluídas:
1. **V1__create_tables.sql** - Cria schema inicial (products, orders, order_items)
2. **V2__insert_sample_products.sql** - Insere produtos
3. **V3__insert_sample_orders.sql** - Insere pedidos com diversos status

## 📚 Documentação da API (Swagger)

O projeto possui **documentação interativa** da API usando **Swagger UI**.

### Acessar Documentação

Após iniciar o backend, acesse:

- **Swagger UI**: http://localhost:8080/swagger-ui.html

### Categorias da API

#### 🏷️ Products
- **POST** `/api/products` - Criar produto (invalida cache)
- **GET** `/api/products` - Listar produtos (cache 15min)
- **GET** `/api/products/{id}` - Buscar por ID (cache 15min)
- **PUT** `/api/products/{id}` - Atualizar produto (invalida cache)
- **DELETE** `/api/products/{id}` - Deletar produto (invalida cache)

#### 📦 Orders
- **POST** `/api/orders` - Criar pedido PENDING (processado por scheduler)
- **GET** `/api/orders` - Listar pedidos (cache 5min)
- **GET** `/api/orders/{id}` - Buscar por ID (cache 5min)
- **PATCH** `/api/orders/{id}/status` - Atualizar status (invalida cache)
- **GET** `/api/orders/status/{status}` - Filtrar por status (cache 3min)

### Testar Endpoints no Swagger

1. Acesse http://localhost:8080/swagger-ui.html
2. Expanda o endpoint desejado (ex: "Products" → "POST /api/products")
3. Clique em **"Try it out"**
4. Preencha o corpo da requisição (exemplo fornecido)
5. Clique em **"Execute"**
6. Veja a resposta com código HTTP, headers e body

### Exemplo de Requisição

```json
POST /api/products
{
  "name": "Notebook Dell",
  "description": "Notebook para desenvolvimento",
  "price": 3500.00,
  "stockQuantity": 10
}
```

---

## ⚡ Cache com Redis

O projeto utiliza **Redis** para cache de consultas frequentes, melhorando significativamente a performance.

### Performance

- 📈 **Produtos**: 68ms → 10ms (6.8x mais rápido)
- ⏱️ **TTL configurável** por tipo de cache
- 🔄 **Invalidação automática** em operações de escrita

### Estratégia de Cache

| Cache | TTL | Uso |
|-------|-----|-----|
| `products` | 15 min | Lista de produtos |
| `product` | 15 min | Produto individual |
| `orders` | 5 min | Lista de pedidos |
| `order` | 5 min | Pedido individual |
| `ordersByStatus` | 3 min | Pedidos por status |

### Verificar Cache

```bash
# Conectar ao Redis
docker exec -it order-management-redis redis-cli

# Listar todas as chaves
KEYS *

# Ver TTL de uma chave
TTL "order-mgmt:products::SimpleKey []"

# Ver conteúdo
GET "order-mgmt:products::SimpleKey []"
```

### Invalidação

O cache é **automaticamente invalidado** quando:
- Produto criado/atualizado/deletado → Limpa cache de produtos
- Pedido criado/status alterado → Limpa cache de pedidos
- Scheduler processa pedidos → Limpa todos os caches

Para mais detalhes, consulte: **[REDIS_CACHE.md](./REDIS_CACHE.md)**

---

## 📝 Licença

Este projeto foi desenvolvido como teste técnico.
