CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) CHECK (price >= 0),
    stock_quantity INT CHECK (stock_quantity >= 0)
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0)
);
