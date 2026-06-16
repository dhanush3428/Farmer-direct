# Security Specification: Direct Farmers Marketplace

This specification outlines the data invariants, validation rules, and threat models for the Firestore database connected to the Farmer Direct marketplace.

## 1. Data Invariants & Collection Schemas

We define the rules of existence for all seven core collections:

1. **/users/{userId}**
   - **Constraint**: Primary authorization profile mapping user security credentials to their selected role (`farmer` or `buyer`).
   - **Invariant**: A user's profile can only be read, created, or updated by the matching authenticated `userId` session owner.

2. **/farmers/{farmerId}**
   - **Constraint**: Public-facing farmer directory.
   - **Invariant**: Read access is available to registered secure users. Creation and modification are restricted strictly to the authenticated farmer matching `{farmerId}`.

3. **/buyers/{buyerId}**
   - **Constraint**: Secure buyer profile.
   - **Invariant**: Read and write access is restricted strictly to the authenticated buyer session matching `{buyerId}`.

4. **/products/{productId}**
   - **Constraint**: Marketplace catalog postings representing direct farmer crop goods.
   - **Invariant**: Must hold a `price` strictly greater than zero and a `stock` (or quantity) of zero or greater (cannot be negative). Can only be written or deleted by its respective `farmerId`.

5. **/orders/{orderId}**
   - **Constraint**: Active and historic booking logs linking a buyer's cart checkout to farmer crops.
   - **Invariant**: Read access restricted to the placing buyer and the target farmers matching the order's items array. Status update can only be touched by the respective farmer.

6. **/wishlist/{wishlistId}**
   - **Constraint**: Item interest board mapped per buyer.
   - **Invariant**: Accessible and manageable exclusively by the matching buyer owner.

7. **/notifications/{notificationId}**
   - **Constraint**: Alerts delivered to users.
   - **Invariant**: Read access restricted to the target recipient (`userId`). Only `read` status field changes can be updated by the recipient.

---

## 2. The "Dirty Dozen" Rogue Payloads (Negative Tests)

The following 12 payloads are designed to challenge our Zero-Trust architecture. Our rules are built to block each of these malicious operations with a `permission-denied` rejection.

### T1: Identity Spoofing (Write on other's user document)
* **Target Path**: `users/victim-123`
* **Secure User Token**: `attacker-abc`
* **Payload**:
  ```json
  {
    "role": "farmer",
    "name": "Attacker"
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T2: Privilege Escalation (Changing user role after creation)
* **Target Path**: `users/user-456`
* **Secure User Token**: `user-456` (role originally was 'buyer')
* **Payload**:
  ```json
  {
    "role": "farmer"
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T3: Negative Price Poisoning
* **Target Path**: `products/crop-abc`
* **Secure User Token**: `farmer-1`
* **Payload**:
  ```json
  {
    "farmerId": "farmer-1",
    "name": "Organic Tomatoes",
    "price": -10,
    "stock": 100,
    "status": "Live"
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T4: Zero Price Poisoning
* **Target Path**: `products/crop-abc`
* **Secure User Token**: `farmer-1`
* **Payload**:
  ```json
  {
    "farmerId": "farmer-1",
    "name": "Organic Tomatoes",
    "price": 0,
    "stock": 100,
    "status": "Live"
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T5: Negative Stock Poisoning
* **Target Path**: `products/crop-abc`
* **Secure User Token**: `farmer-1`
* **Payload**:
  ```json
  {
    "farmerId": "farmer-1",
    "name": "Organic Tomatoes",
    "price": 40,
    "stock": -1,
    "status": "Live"
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T6: Unauthorized Product Creation by non-Farmer
* **Target Path**: `products/crop-abc`
* **Secure User Token**: `buyer-2` (role: 'buyer')
* **Payload**:
  ```json
  {
    "farmerId": "buyer-2",
    "name": "Fake Tomatoes",
    "price": 25,
    "stock": 50,
    "status": "Live"
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T7: Product Hijack (Farmer editing another farmer's product)
* **Target Path**: `products/crop-legit`
* **Secure User Token**: `farmer-attacker`
* **Payload**:
  ```json
  {
    "farmerId": "farmer-attacker",
    "name": "Hijacked Tomatoes",
    "price": 10
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T8: Order Reading Snooping
* **Target Path**: `orders/order-xyz` (order between buyer-1 and farmer-1)
* **Secure User Token**: `buyer-attacker` (not involved in this order)
* **Expected**: `PERMISSION_DENIED`

### T9: Farmer Tampering with Order Items or Customer Details
* **Target Path**: `orders/order-xyz`
* **Secure User Token**: `farmer-1`
* **Payload**:
  ```json
  {
    "status": "Accepted",
    "total": 0,
    "items": []
  }
  ```
* **Expected**: `PERMISSION_DENIED` (can only update status)

### T10: Wishlist Intrusion
* **Target Path**: `wishlist/buyer-victim`
* **Secure User Token**: `attacker-abc`
* **Payload**:
  ```json
  {
    "saved": ["crop-1"]
  }
  ```
* **Expected**: `PERMISSION_DENIED`

### T11: Notification Interception (Viewing someone else's alerts)
* **Target Path**: `notifications/victim-notif`
* **Secure User Token**: `attacker-abc`
* **Expected**: `PERMISSION_DENIED`

### T12: Unauthenticated Database Access
* **Target Path**: `farmers/farmer-1`
* **Secure User Token**: `unauthenticated` (anonymous/guest without token)
* **Expected**: `PERMISSION_DENIED`

---

## 3. Test Verification Rules Runner

We declare a specification validation framework:

```ts
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// Verification suite executes the security spec rules, targeting the rules to reject ALL 12 Dirty Dozen payloads as compiled above.
```
