# Diagramme de classes

```mermaid
classDiagram
  User "1" --> "*" Order
  Menu "1" --> "*" Order
  Menu "*" --> "*" Dish
  Dish "*" --> "*" Allergen
  Menu "1" --> "*" MenuImage
  Order "1" --> "*" OrderStatusHistory
  Order "1" --> "0..1" Review
  User : Role role
  Menu : BigDecimal basePrice
  Order : BigDecimal totalAmount
```
