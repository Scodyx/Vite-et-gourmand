-- PostgreSQL 16 - schéma relationnel Vite & Gourmand
CREATE TABLE app_user (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  address_line VARCHAR(255),
  postal_code VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('USER','EMPLOYEE','ADMIN')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  conditions TEXT NOT NULL,
  minimum_persons INTEGER NOT NULL CHECK (minimum_persons > 0),
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  available_stock INTEGER NOT NULL CHECK (available_stock >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  theme VARCHAR(80) NOT NULL,
  diet VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_image (
  id BIGSERIAL PRIMARY KEY, menu_id BIGINT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL, alt_text VARCHAR(255) NOT NULL, display_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE dish (
  id BIGSERIAL PRIMARY KEY, name VARCHAR(160) NOT NULL, description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('ENTRY','MAIN_COURSE','DESSERT')), active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE allergen (id BIGSERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE);
CREATE TABLE menu_dish (
  menu_id BIGINT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  dish_id BIGINT NOT NULL REFERENCES dish(id), PRIMARY KEY (menu_id, dish_id)
);
CREATE TABLE dish_allergen (
  dish_id BIGINT NOT NULL REFERENCES dish(id) ON DELETE CASCADE,
  allergen_id BIGINT NOT NULL REFERENCES allergen(id), PRIMARY KEY (dish_id, allergen_id)
);

CREATE TABLE customer_order (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES app_user(id),
  menu_id BIGINT NOT NULL REFERENCES menu(id),
  person_count INTEGER NOT NULL CHECK (person_count > 0),
  prestation_date DATE NOT NULL,
  desired_delivery_time TIME NOT NULL,
  delivery_address VARCHAR(255) NOT NULL,
  delivery_postal_code VARCHAR(20) NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_country VARCHAR(100) NOT NULL,
  distance_km NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  outside_bordeaux BOOLEAN NOT NULL,
  menu_amount NUMERIC(10,2) NOT NULL CHECK (menu_amount >= 0),
  delivery_amount NUMERIC(10,2) NOT NULL CHECK (delivery_amount >= 0),
  discount_amount NUMERIC(10,2) NOT NULL CHECK (discount_amount >= 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(40) NOT NULL,
  equipment_loaned BOOLEAN NOT NULL DEFAULT FALSE,
  equipment_returned_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_contact_mode VARCHAR(30),
  cancellation_contact_at TIMESTAMPTZ,
  cancelled_by BIGINT REFERENCES app_user(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_status_history (
  id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
  previous_status VARCHAR(40), new_status VARCHAR(40) NOT NULL, changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by BIGINT REFERENCES app_user(id), comment TEXT
);
CREATE TABLE review (
  id BIGSERIAL PRIMARY KEY, customer_id BIGINT NOT NULL REFERENCES app_user(id),
  order_id BIGINT NOT NULL UNIQUE REFERENCES customer_order(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), comment TEXT NOT NULL,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  moderated_at TIMESTAMPTZ, moderated_by BIGINT REFERENCES app_user(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE opening_hours (
  id BIGSERIAL PRIMARY KEY, day_of_week VARCHAR(10) NOT NULL UNIQUE,
  opening_time TIME, closing_time TIME, closed BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL UNIQUE,
  CHECK (closed OR (opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time))
);
CREATE TABLE contact_request (
  id BIGSERIAL PRIMARY KEY, email VARCHAR(190) NOT NULL, title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, processed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE password_reset_token (
  id BIGSERIAL PRIMARY KEY, token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE refresh_token (
  id BIGSERIAL PRIMARY KEY, token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_role_enabled ON app_user(role, enabled);
CREATE INDEX idx_menu_filters ON menu(active, theme, diet, base_price);
CREATE INDEX idx_order_customer ON customer_order(customer_id, created_at DESC);
CREATE INDEX idx_order_status_date ON customer_order(status, prestation_date);
CREATE INDEX idx_order_number ON customer_order(order_number);
CREATE INDEX idx_review_moderation ON review(moderation_status, created_at);
CREATE INDEX idx_reset_expiry ON password_reset_token(expires_at);
