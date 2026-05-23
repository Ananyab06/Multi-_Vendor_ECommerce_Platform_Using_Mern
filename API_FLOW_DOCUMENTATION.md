# Multi-Vendor E-Commerce Platform — Complete API Flow Documentation

This document describes every major user action, listing the sequence of API endpoints invoked, the backend methods executed, their internal database logic, and the resulting frontend state updates.

---

## 1. Customer Login Flow
*   **Trigger:** Customer clicks the "Sign In" button on the Login page.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/auth/login`
        *   **Method:** `authController.login`
    2.  **API Call:** `GET /api/cart`
        *   **Method:** `cartController.getCart`
    3.  **API Call:** `GET /api/wishlist`
        *   **Method:** `wishlistController.getWishlist`
    4.  **API Call:** `GET /api/orders/user`
        *   **Method:** `orderController.getUserOrders`
    5.  **API Call:** `GET /api/bookings/user`
        *   **Method:** `bookingController.getUserBookings`

*   **Detailed Logic & Database Operations:**
    *   `authController.login`: Extracts `email` or `mobile` (as `identifier`) and `password` from the body. Queries the `User` collection via regex lookup, validates the hashed password using `user.comparePassword()`, generates a 7-day JWT token, and returns the token and profile.
    *   `cartController.getCart`: Finds the cart associated with the logged-in user ID. If no cart exists, it immediately prepares and saves an empty cart object (`{ userId: req.user.id, items: [] }`).
    *   `wishlistController.getWishlist`: Retrieves the wishlist matching the user's ID. If none is found, it initializes and saves an empty wishlist.
    *   `orderController.getUserOrders`: Queries all orders matching the user ID, sorted by creation time (`createdAt: -1`).
    *   `bookingController.getUserBookings`: Retrieves all services booked by this user ID.
*   **Frontend State Changes (`AppContext.js`):**
    *   Sets `user` state.
    *   Stores `token` and `accountType` ("user") in `localStorage`.
    *   Saves returned items to `cart`, `wishlist`, `orders`, and `serviceBookings` state.

---

## 2. Customer Registration Flow
*   **Trigger:** Customer clicks the "Create account" button on the Sign-Up page.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/auth/register`
        *   **Method:** `authController.register`

*   **Detailed Logic & Database Operations:**
    *   `authController.register`: Extracts `name`, `email`, `password`, `role` (defaults to 'user'), and optional `mobile` from the request body. Checks the database to ensure no user with that email or mobile already exists. Saves a new `User` document (hashed password), signs a JWT token, and returns both token and user profile.
*   **Frontend State Changes (`AppContext.js`):**
    *   Sets `user` state.
    *   Stores token and accountType in `localStorage`.

---

## 3. Vendor Login Flow
*   **Trigger:** Vendor toggles account type to "Vendor" and clicks "Sign In as Vendor".
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/vendor/login`
        *   **Method:** `vendorController.login`
    2.  **API Call:** `GET /api/bookings/vendor/:vendorId`
        *   **Method:** `bookingController.getVendorBookings`

*   **Detailed Logic & Database Operations:**
    *   `vendorController.login`: Authenticates vendor using email/mobile and password against the `Vendor` collection. Generates a signed JWT token.
    *   `bookingController.getVendorBookings`: Queries the `ServiceBooking` collection for service bookings assigned to this vendor ID or store name. Computes total revenue for bookings marked "Completed".
*   **Frontend State Changes (`AppContext.js`):**
    *   Sets `user` state with `isVendor: true`.
    *   Saves token and accountType ("vendor") to `localStorage`.
    *   Populates `serviceBookings` state with vendor-specific booking items.

---

## 4. Vendor Registration Flow
*   **Trigger:** Vendor clicks the "Register as vendor" button on the Sign-Up page.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/vendor/register`
        *   **Method:** `vendorController.register`

*   **Detailed Logic & Database Operations:**
    *   `vendorController.register`: Reads `name`, `email`, `password`, `storeName`, and `mobile` from request body. Ensures the mobile and email are not registered to another vendor. Creates and saves a new `Vendor` document, signs a JWT, and returns it.
*   **Frontend State Changes (`AppContext.js`):**
    *   Sets `user` state with `isVendor: true`.
    *   Stores token and accountType ("vendor") to `localStorage`.

---

## 5. Add Product to Cart Flow
*   **Trigger:** Customer clicks "Add to Cart" on a product card or details page.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/cart/add`
        *   **Method:** `cartController.addToCart`

*   **Detailed Logic & Database Operations:**
    *   `cartController.addToCart`: Extracts `productId` and `quantity` from request body. Ensures product exists and has sufficient stock. Looks up user's cart; if not present, creates one. Checks if the item exists in the cart: if yes, updates the quantity; if no, pushes the item. Saves cart to database.
*   **Frontend State Changes (`AppContext.js`):**
    *   Updates the `cart` state array optimistically (either incrementing `quantity` of the item, or adding a new cart item mapping standard product details).

---

## 6. Update Cart Quantity Flow
*   **Trigger:** Customer adjusts the item quantity inside the Cart page.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `PUT /api/cart/update`
        *   **Method:** `cartController.updateCartItem`

*   **Detailed Logic & Database Operations:**
    *   `cartController.updateCartItem`: Takes `productId` and `quantity` from request body. Finds user's cart document, locates item index, and assigns new quantity. Saves to database and returns the populated cart.
*   **Frontend State Changes (`AppContext.js`):**
    *   Updates the local `cart` state array with the new quantity.

---

## 7. Remove Item from Cart Flow
*   **Trigger:** Customer clicks the delete bin/trash icon next to an item in the Cart page.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `DELETE /api/cart/remove`
        *   **Method:** `cartController.removeFromCart`

*   **Detailed Logic & Database Operations:**
    *   `cartController.removeFromCart`: Takes `productId` from request body. Loads user's cart, filters out the product ID from the `items` array, saves the cart document, and returns the updated document.
*   **Frontend State Changes (`AppContext.js`):**
    *   Filters the local `cart` state array to exclude the removed item.

---

## 8. Toggle Item in Wishlist Flow
*   **Trigger:** Customer clicks the heart icon on any product page.
*   **Step-by-Step API Sequence:**
    *   *If item not in wishlist:*
        1.  **API Call:** `POST /api/wishlist/add`
            *   **Method:** `wishlistController.addToWishlist`
    *   *If item is in wishlist:*
        1.  **API Call:** `DELETE /api/wishlist/remove`
            *   **Method:** `wishlistController.removeFromWishlist`

*   **Detailed Logic & Database Operations:**
    *   `wishlistController.addToWishlist`: Pushes product ID to user's `products` list in the `Wishlist` document and saves it.
    *   `wishlistController.removeFromWishlist`: Removes product ID from user's `products` list in the `Wishlist` document and saves it.
*   **Frontend State Changes (`AppContext.js`):**
    *   Pushes or filters items from the global `wishlist` state array.

---

## 9. Create Product Flow (Vendor Inventory Addition)
*   **Trigger:** Vendor submits the "Add Product" form.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/upload/image` (to host file)
        *   **Method:** `uploadController.uploadImage`
    2.  **API Call:** `POST /api/products` (to create inventory item)
        *   **Method:** `productController.createProduct`

*   **Detailed Logic & Database Operations:**
    *   `uploadController.uploadImage`: Multer parses the image file, saves it in `/uploads/`, and returns the absolute URL.
    *   `productController.createProduct`: Saves a new `Product` document with the details, setting `vendorId` to the current `req.vendor.id`.
*   **Frontend State Changes (`AppContext.js`):**
    *   Appends the newly created product document into the `products` catalog state array.

---

## 10. Update Product Flow (Vendor Inventory Edit)
*   **Trigger:** Vendor submits the "Edit Product" form.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `PUT /api/products/:id`
        *   **Method:** `productController.updateProduct`

*   **Detailed Logic & Database Operations:**
    *   `productController.updateProduct`: Fetches product by ID. Verifies product ownership (`product.vendorId.toString() === req.vendor.id`). Modifies updated fields and saves the changes.
*   **Frontend State Changes (`AppContext.js`):**
    *   Maps through the local `products` catalog array, replacing the outdated product instance with the newly returned product object.

---

## 11. Delete Product Flow (Vendor Inventory Removal)
*   **Trigger:** Vendor clicks the "Delete Product" button on their dashboard.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `DELETE /api/products/:id`
        *   **Method:** `productController.deleteProduct`

*   **Detailed Logic & Database Operations:**
    *   `productController.deleteProduct`: Finds the product document. Validates that the logged-in vendor matches the product owner. If so, calls `product.deleteOne()`.
*   **Frontend State Changes (`AppContext.js`):**
    *   Filters the local catalog state to remove this product:
        `setProducts(prev => prev.filter(p => p.id !== id))`
    *   Removes the deleted item from any active customer cart/wishlist representations loaded in memory:
        `setCart(prev => prev.filter(item => item.id !== id))`
        `setWishlist(prev => prev.filter(item => item.id !== id))`

---

## 12. Add Shipping Address Flow
*   **Trigger:** Customer submits the "Add Address" form during checkout.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/addresses`
        *   **Method:** `addressController.addAddress`

*   **Detailed Logic & Database Operations:**
    *   `addressController.addAddress`: Saves a new shipping address document containing street, city, state, and zip, mapped to the user ID.
*   **Frontend State Changes (`Cart.js`):**
    *   Adds address to `addresses` array state and sets it as the selected address.

---

## 13. Checkout & Order Placement Flow
*   **Trigger:** Customer clicks the "Place Order" button.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/orders`
        *   **Method:** `orderController.createOrder`
    2.  **Socket Event Emit:** `new_order` (Emitted internally by Server)
        *   **Method:** `socket.js -> notifyVendorsNewOrder`
    3.  **API Call:** `DELETE /api/cart/clear` (Triggered internally in server during checkout, or via client)
        *   **Method:** `cartController.clearCart`

*   **Detailed Logic & Database Operations:**
    *   `orderController.createOrder`:
        1. Reads user's cart. Iterates through items.
        2. Performs atomic inventory checks and deductions:
           `Product.findOneAndUpdate({ _id: product._id, stock: { $gte: requestedQty } }, { $inc: { stock: -requestedQty } })`
           If any product is out of stock, cancels and returns `400 Bad Request`.
        3. Saves `Order` document with status `"processing"`.
        4. Triggers the WebSocket notification helper to notify each unique vendor.
        5. Empties the customer's cart items in database.
*   **Frontend State Changes (`AppContext.js`):**
    *   Appends the new order to the client's `orders` history state.
    *   Empties the customer's local `cart` state array.
    *   Directs catalog products list to deduct stock levels for ordered items.

---

## 14. Order Feedback Submission Flow
*   **Trigger:** Customer writes feedback and rates a delivered order.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/orders/:orderId/feedback`
        *   **Method:** `orderController.submitOrderFeedback`

*   **Detailed Logic & Database Operations:**
    *   `orderController.submitOrderFeedback`: Finds order by ID. Ensures order ownership and checks if status is `"delivered"`. Saves rating and comment inside the order's `feedback` subdocument.
*   **Frontend State Changes (`AppContext.js`):**
    *   Updates the local order item in the `orders` list state to hold the feedback subdocument.

---

## 15. Download Invoice Flow
*   **Trigger:** Customer clicks the "Download Invoice" link on their order card.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `GET /api/orders/:orderId/invoice`
        *   **Method:** `orderController.downloadInvoice`

*   **Detailed Logic & Database Operations:**
    *   `orderController.downloadInvoice`: Loads the invoice order, verifies customer permission, dynamically draws a PDF tax invoice using `pdfkit`, and pipes the binary data response stream back with attachment disposition headers.
*   **Frontend Actions:**
    *   Downloads the PDF file directly to the client disk.

---

## 16. Book Service Flow
*   **Trigger:** Customer clicks the "Book Service" button.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `POST /api/bookings`
        *   **Method:** `bookingController.createBooking`

*   **Detailed Logic & Database Operations:**
    *   `bookingController.createBooking`: Resolves vendor identity matching the provider's name. Saves the booking document under the customer ID with status `"Pending"` and technician field `"Pending Assignment"`.
*   **Frontend State Changes (`AppContext.js`):**
    *   Appends the new booking card to the local `serviceBookings` state.

---

## 17. Update Booking Status Flow (Vendor)
*   **Trigger:** Vendor accepts or completes a booking request from their dashboard.
*   **Step-by-Step API Sequence:**
    1.  **API Call:** `PATCH /api/bookings/:bookingId/status`
        *   **Method:** `bookingController.updateBookingStatus`

*   **Detailed Logic & Database Operations:**
    *   `bookingController.updateBookingStatus`: Checks booking by ID. Updates status field (`Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `Completed`). Assigns technician fields automatically when confirmed. Saves booking.
*   **Frontend State Changes (`AppContext.js`):**
    *   Updates the local booking status in the `serviceBookings` array.
