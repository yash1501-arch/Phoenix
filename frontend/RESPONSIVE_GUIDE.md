# Responsive Design Guide - Phoenix Adventures

## Breakpoint Reference

### Mobile First Approach
All designs start with mobile and scale up.

## Tailwind Breakpoints Used

| Breakpoint | Min Width | Target Devices | Layout Changes |
|------------|-----------|----------------|----------------|
| `default` | 0px | Mobile phones | 1 column, stacked elements |
| `sm:` | 640px | Large phones, small tablets | 2 columns for grids |
| `md:` | 768px | Tablets | Desktop nav visible, 3 columns |
| `lg:` | 1024px | Small desktops | Full 4 column grids |
| `xl:` | 1280px | Large desktops | Max container width |
| `2xl:` | 1536px | Extra large desktops | Extra spacing |

## Component-Specific Breakpoints

### Navbar
```jsx
- Mobile (< 1024px): Hamburger menu
- Desktop (>= 1024px): Horizontal navigation
- Logo text hidden on sm, visible from sm:
```

### Hero Section
```jsx
- Mobile: Single column, centered text
- lg: Two column grid (text | images)
- Text sizes: 4xl → 5xl → 6xl → 7xl → 8xl
```

### Adventures Grid
```jsx
- Mobile: 1 column (grid-cols-1)
- sm: 2 columns (sm:grid-cols-2)
- lg: 4 columns (lg:grid-cols-4)
```

### Stats Section
```jsx
- Mobile: 2 columns (grid-cols-2)
- md: 4 columns (md:grid-cols-4)
```

### Footer
```jsx
- Mobile: 1 column stacked
- sm: 2 columns (sm:grid-cols-2)
- lg: 4 columns (lg:grid-cols-4)
```

## Common Patterns

### Padding/Spacing
```jsx
// Sections
py-16 sm:py-20 md:py-24 lg:py-32

// Containers
px-4 sm:px-6 lg:px-8

// Gaps
gap-4 md:gap-6 lg:gap-8
```

### Typography
```jsx
// Headings
text-3xl sm:text-4xl md:text-5xl lg:text-6xl

// Body
text-base sm:text-lg md:text-xl

// Small text
text-xs sm:text-sm
```

### Buttons
```jsx
// Padding
px-6 md:px-8 lg:px-10
py-3 md:py-4

// Text
text-sm md:text-base lg:text-lg
```

### Cards/Elements
```jsx
// Sizing
w-10 h-10 md:w-12 md:h-12

// Rounding
rounded-2xl md:rounded-3xl

// Spacing
p-3 md:p-4 lg:p-6
```

## Testing Checklist

### Mobile (375px - 639px)
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px
- [ ] Readable font sizes (≥ 16px body)
- [ ] Hamburger menu works
- [ ] Images load and scale properly
- [ ] CTA buttons are prominent
- [ ] Forms are usable

### Tablet (640px - 1023px)
- [ ] 2-column grids work
- [ ] Images maintain aspect ratio
- [ ] Navigation is accessible
- [ ] Content doesn't feel cramped
- [ ] Touch interactions work

### Desktop (1024px+)
- [ ] Full navigation visible
- [ ] Multi-column layouts work
- [ ] Hover states function
- [ ] Content uses available space
- [ ] No excessive whitespace

## Common Issues & Solutions

### Issue: Text too small on mobile
```jsx
// Bad
className="text-sm"

// Good
className="text-base sm:text-sm"
```

### Issue: Images breaking layout
```jsx
// Use aspect ratio utilities
className="aspect-[4/5]"
// or
className="w-full h-auto"
```

### Issue: Buttons too small on mobile
```jsx
// Bad
className="px-4 py-2"

// Good
className="px-6 py-3 md:px-8 md:py-4"
```

### Issue: Grids not responsive
```jsx
// Bad
className="grid grid-cols-4"

// Good
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
```

## Performance Tips

1. **Use Clamp for Fluid Typography**
```css
font-size: clamp(2rem, 8vw, 4rem);
```

2. **Optimize Images**
- Use proper sizes for each breakpoint
- Consider using `srcset` for different resolutions
- Use WebP format when possible

3. **Lazy Load Below Fold**
```jsx
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
>
```

4. **Minimize Layout Shifts**
- Define width/height for images
- Use aspect-ratio utilities
- Reserve space for dynamic content

## Browser DevTools Testing

### Chrome DevTools
1. Press F12
2. Click device toolbar (Ctrl+Shift+M)
3. Test these presets:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad Air (820x1180)
   - iPad Pro (1024x1366)

### Responsive Design Mode
1. Toggle between Portrait/Landscape
2. Test at custom widths (768px, 1024px, 1440px)
3. Check for:
   - Overflow
   - Text readability
   - Touch target sizes
   - Image quality

## Quick Reference

### Hide/Show at Breakpoints
```jsx
// Hide on mobile, show on lg+
className="hidden lg:block"

// Show on mobile, hide on lg+
className="block lg:hidden"

// Show only in range
className="hidden sm:block lg:hidden"
```

### Flex Direction Changes
```jsx
// Stack on mobile, row on desktop
className="flex flex-col lg:flex-row"
```

### Text Alignment
```jsx
// Center on mobile, left on desktop
className="text-center lg:text-left"
```

---

**Remember**: Always test on real devices when possible, not just in DevTools!
