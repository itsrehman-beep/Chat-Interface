# Design Guidelines: Cerebras Model Chat Interface

## Design Approach
**System-Based Approach**: This is a utility-focused, information-dense application requiring efficiency and clarity. We'll use a custom design system optimized for chat interfaces and data inspection.

---

## Core Design Elements

### Color System
- **Primary**: `#6366F1` (Indigo-500)
- **Secondary**: `#8B5CF6` (Purple-500)
- **Background**: `#F9FAFB` (Gray-50)
- **Text**: `#111827` (Gray-900)
- **Code/Detail Pane**: `#1F2937` (Gray-800)
- **Accent**: `#10B981` (Green-500)
- **Error**: Standard red for error states

### Typography
- **Primary Font**: Inter / SF Pro / System font stack
- **Monospace Font**: For key-value pairs, JSON details, and code blocks
- **Hierarchy**:
  - Headers: 18-24px, semibold
  - Body text: 14-16px, regular
  - Key-value pairs: 14px monospace
  - Labels: 12px, medium

### Spacing System
**Tailwind units**: 2, 4, 6, 8, 12, 16
- Component padding: `p-4` to `p-6`
- Section gaps: `gap-4` to `gap-8`
- Message spacing: `space-y-4`

---

## Layout Structure

### Three-Column Layout
1. **Header** (fixed top): Model selector dropdown, full width
2. **Left Pane** (60% width): Chat conversation area
3. **Right Pane** (40% width): Inspector sidebar - auto-opens on response

### Responsive Behavior
- **Desktop** (lg+): Side-by-side layout
- **Mobile/Tablet**: Inspector stacks below chat area

---

## Component Library

### 1. Model Selector (Header)
- Dropdown with loading state indicator
- Disabled state until models load
- Clear visual hierarchy with label

### 2. Chat Area Components

**Message List**:
- User messages: Right-aligned, primary color background
- Assistant messages: Left-aligned, gray background
- Clickable messages with hover state
- Selected message: Highlighted border/background

**Tool Response Rendering**:
- Flat key-value list format (one per line)
- Monospace font for values
- Image URLs: Small avatar/icon display (24x24px or 32x32px)
- Format: `KeyName: value`

**Message Input**:
- Text area with auto-expand
- Send button (disabled until model selected)
- Clear submit state

### 3. Side Pane Inspector

**Structure**:
- Auto-opens when response arrives
- Two expandable sections:
  1. Intent Analyzer Response
  2. Runtime Prompt Response

**Field Rendering**:
- Auto-generated form fields (read-only)
- Label-value pairs vertically stacked
- Markdown rendering for reasoning text
- Collapsible `reasoning_details` block
- `usage` tokens & cost always visible at bottom

**Visual Treatment**:
- Dark background (`#1F2937`)
- Light text for contrast
- Expandable sections with chevron icons
- Subtle borders between sections

### 4. State Components
- **Loading Overlay**: Spinner with semi-transparent backdrop
- **Error Banner**: Red accent, dismissible, top of viewport
- **Empty States**: Centered text prompts when no messages exist

---

## Interaction Patterns

### Click Behaviors
- Chat messages → Load JSON into inspector
- Expandable sections → Toggle with smooth animation
- Model selector → Dropdown with keyboard navigation

### Visual Feedback
- Hover states on clickable messages
- Active/selected message highlighting
- Loading spinners during API calls
- Disabled states clearly differentiated

---

## Data Visualization

### Tool Response Display
```
AccountType: Checking
Currency: USD
CalculatedBalance: 7077.249
[Icon] AccountImageUrl: https://...
```

### JSON Inspector
- Nested object handling with indentation
- Collapsible sections for complex data
- Syntax highlighting for JSON values
- Copy-to-clipboard buttons for code blocks

---

## Accessibility
- Focus states for all interactive elements
- ARIA labels for icon-only buttons
- Keyboard navigation for all features
- Sufficient color contrast ratios
- Screen reader friendly structure

---

## Images
**No hero images needed** - this is a utility application focused on chat and data inspection.

**Image usage**:
- Small avatars/icons (24-32px) for account image URLs within tool responses
- Icons for UI elements (expand/collapse, send, error, loading)