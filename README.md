# RabbitMQ Architecture Guide: When to Use Queues, Exchanges, Routing Keys, and Virtual Hosts

This guide explains the core components of RabbitMQ (Exchanges, Queues, Routing Keys, and Virtual Hosts) and provides best practices on when and how to use them based on architectural needs.

---

## 1. Exchanges

An **Exchange** is the entry point of your message broker. It receives messages from producers and pushes them to one or more queues based on rules called **bindings**.

### When to create an Exchange?
* **Use a single Exchange (Topic type) per domain/application:** In most cases, you only need **one** exchange for your entire application or domain (e.g., an exchange named `app_events` or `status`). 
* **Do NOT create an exchange per event:** Creating a new exchange for every single event is an anti-pattern. The exchange acts as the central router; it shouldn't change just because your event types change.
* **When to use multiple Exchanges:** Only create separate exchanges when you have strictly isolated business domains, distinct team boundaries, different security/permissions (AMQP ACLs), or vastly different infrastructural traffic profiles.

---

## 2. Routing Keys

A **Routing Key** is a message attribute that the Exchange looks at to decide how to route the message to queues.

### When to use Routing Keys?
* **To categorize and filter events dynamically:** Use routing keys whenever a single producer needs to send different types of events to a shared exchange.
* **Naming Convention:** Use a hierarchical dot-separated format (`domain.entity.action`) to enable wildcards (`*` for a single word, `#` for multiple words).
* **Examples:**
  * `status.user.registered`
  * `status.order.shipped`
  * `status.payment.failed`

---

## 3. Queues

A **Queue** is a buffer that stores messages until a consumer is ready to process them. 

### When to create a Queue?
* **Create a queue per consumer service / microservice:** Each independent worker or microservice that needs to process specific data should have its own dedicated queue.
* **Decoupling via Bindings:** Instead of sending messages directly to a queue, your queues should **bind** to the central Exchange using routing key patterns. 
* **Example:** 
  * A `notification_service` queue binds to `status` with the pattern `status.order.*` to receive only order-related status updates.
  * An `audit_service` queue binds to `status` with `#` to receive all system events.
* **When to use the Default Exchange (`""`):** Only use direct queue publishing (the default exchange where the routing key must match the queue name) if you have a simple 1-to-1 task worker setup and do not need event-driven pub/sub flexibility.

---

## 4. Virtual Hosts (vhosts)

A **Virtual Host** provides logical isolation within a single RabbitMQ broker, allowing multiple applications or environments to share the same instance with separate exchanges, queues, permissions, and users.

### When to create a Virtual Host?
* **Environment Separation:** Use separate vhosts for different environments (e.g., `/dev`, `/staging`, `/production`) on the same broker instance.
* **Multi-tenancy / Different Applications:** Use separate vhosts when completely unrelated applications share the same RabbitMQ server to prevent naming collisions and ensure strict access control boundaries.
* **Independent Permissions:** When different teams or microservice boundaries require isolated access user permissions.