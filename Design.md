# UMKMify Design System

## 1. Design Philosophy

UMKMify is a modern e-commerce platform designed to help
Indonesian elders that Not good with technology UMKM businesses digitize their products, storefronts, and sales operations.

The design should prioritize:

- Simplicity
- Accessibility
- Trust
- Clarity
- Consistency

---

## 2. Design Principles

### Simple

Interfaces should be easy to understand, especially for
users who are not familiar with digital commerce.

### Accessible

Information, actions, and navigation should remain clear
and accessible across different screen sizes.

### Consistent

Components, spacing, typography, colors, and interactions
should follow a consistent design system.

### Trustworthy

Product information, pricing, seller information,
reviews, and transaction status should be presented clearly.

### Responsive

The interface must work properly on:

- Desktop

---

## 3. Color System

### Primary

#00B9FB Used for:

- Primary buttons
- Links
- Active states
- Important actions

#FAA500 ### Secondary 

Used for:

- Secondary actions
- Supporting UI elements

### Neutral 

#F8F8FF Used for:

- Backgrounds
- Cards
- Borders
- Text

### Semantic Colors

#### Success

#3DCC3F 
Used for successful actions and completed transactions.

#### Warning

#FAA500
Used for warnings and pending states.

#### Error

#FF3838
Used for errors, failed transactions, and destructive actions.

#### Info

#00B9FB
Used for informational messages.

---

## 4. Typography

### Font Family

Primary:
`Lexend`

Fallback:
`system-ui, sans-serif`

### Typography Scale

- Paragraph 16px and 18px
- H1 48px
- H2 32px
- H3 24px
- Caption 12px

Typography should prioritize readability and clear
information hierarchy.

---

## 5. Spacing

Use a consistent spacing scale.

Example:

- 4px
- 8px
- 12px
- 16px
- 24px
- 32px
- 48px
- 64px

Avoid arbitrary spacing values whenever possible.

---

## 6. Layout

UMKMify uses a responsive layout system.

### Desktop

- Maximum content width
- Sidebar navigation where appropriate
- Multi-column product grids

---

## 7. Components

The UI should be built using reusable components.

### Core Components

- Button
- Input
- Select
- Dropdown
- Toast
- Badge

### E-Commerce Components

- Product Card
- Product Gallery
- Product Variant Selector
- Price Display
- Rating
- Review Card
- Cart Item
- Order Card
- Seller Card

---

## 8. Buttons

### Primary

Used for the most important action on a page.

### Secondary

Used for supporting actions.

### Ghost

Used for low-emphasis actions.

### Destructive

Used for irreversible or dangerous actions.

Every button must provide clear:

- Default state
- Hover state
- Focus state
- Active state
- Disabled state
- Loading state

---

## 9. Forms

Forms should:

- Use clear labels
- Provide validation feedback
- Show errors near the related field
- Preserve user input when possible
- Clearly indicate required fields

---

## 10. Product Design

Product pages should clearly display:

- Product images
- Product name
- Price
- Stock
- Variants
- Seller
- Rating
- Description

The primary purchase action should always remain easy to find.

---

## 11. Navigation

Primary navigation should provide access to:

- Home
- Products
- Categories
- Cart
- Orders
- About Me
- Contact Us

Seller users should additionally have access to:

- Dashboard
- Orders
- Product List
- Add New Products

---

## 12. Responsive Breakpoints

The interface should support:

- Desktop
- Large Desktop

Breakpoints should follow the project's Tailwind CSS configuration.

---

## 13. Animation

Framer Motion should be used for purposeful interactions.

Animations may be used for:

- Dropdowns
- Toast notifications
- Product interactions
- Loading states

Animations should remain subtle and should never interfere
with usability.

---

## 14. Accessibility

UMKMify should follow accessible design practices.

Requirements:

- Sufficient color contrast
- Keyboard navigation
- Visible focus states
- Semantic HTML
- Accessible form labels
- Alt text for meaningful images
- Appropriate ARIA attributes

---

## 15. UX States

Every major component should consider:

- Default
- Loading
- Empty
- Error
- Success
- Disabled

Example:

Product list:

Loading → Products → Empty State → Error State

---

## 16. Design Tokens

Design values should eventually be converted into reusable
design tokens.

Example:

```text
colors/
spacing/
typography/
radius/
shadow/
motion/