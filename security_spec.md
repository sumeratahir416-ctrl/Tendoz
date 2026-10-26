# Security Specification & Threat Model

## Data Invariants
1. **Menu Invariant**: Menu items can be viewed by all guests and customers (`allow read: if true;`), but only verified administrators (`behstvs@gmail.com`) can create, update, or delete menu items.
2. **Order Invariant**: Every order submitted through checkout must have a valid identifier, required customer contact details (Full Name, Phone Number, Address), order items array, valid numeric total bill, and valid order status ('Preparing', 'Out for Delivery', 'Delivered').
3. **Data Privacy & Isolation Invariant**: Customers can only view their own orders (`resource.data.userId == request.auth.uid`). No customer or guest can list or read another customer's personal details, address, or phone number.
4. **Cart Isolation Invariant**: Shopping cart state is stored per device in local client storage, completely isolated from other devices and sessions.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Admin Impersonation Write on Menu**: Unauthenticated write to `/menu/test-item` -> `PERMISSION_DENIED`.
2. **Non-Admin Update on Menu**: Authenticated normal user updating price on `/menu/pizza-tikka` -> `PERMISSION_DENIED`.
3. **Menu Item Deletion by Customer**: Non-admin deleting `/menu/pocket-pizza` -> `PERMISSION_DENIED`.
4. **Cross-Customer Order Snoop (Get)**: User A attempting `get` on `/orders/ORD-USER-B` where `userId != request.auth.uid` -> `PERMISSION_DENIED`.
5. **Blanket Order Scraping (List)**: Unauthenticated user attempting to query all documents in `/orders` -> `PERMISSION_DENIED`.
6. **Order User ID Spoofing**: Authenticated User A submitting an order with `userId: "user-b"` -> `PERMISSION_DENIED`.
7. **Malformed Order Payload (Negative Price)**: Order creation with `totalBill: -500` -> `PERMISSION_DENIED`.
8. **Missing Mandatory Fields**: Order creation without required `address` or `phone` -> `PERMISSION_DENIED`.
9. **Junk Character Path Variable Injection**: Writing to `/orders/!!!INVALID###` -> `PERMISSION_DENIED`.
10. **State Step Tampering by Customer**: Customer attempting to update order status to `Delivered` -> `PERMISSION_DENIED`.
11. **Order Total Modification**: Customer attempting to mutate an already placed order's total bill -> `PERMISSION_DENIED`.
12. **Catch-All Default Deny**: Accessing undeclared collection `/system_secrets/config` -> `PERMISSION_DENIED`.
