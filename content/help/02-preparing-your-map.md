# Preparing Your Map

The quality of your generated description depends on how you set up your map view before clicking "Generate Description." Think of it this way: **what you see is what gets described**. The AI analyzes a screenshot of your current map view, so taking a few moments to prepare that view will dramatically improve your results.

---

## Why Preparation Matters

Accessible Map Agent uses AI vision to analyze exactly what appears on your screen. It combines this visual analysis with layer metadata (titles, descriptions, symbology) to create accurate, meaningful descriptions. Better input leads to better output:

- **Cluttered maps** produce cluttered descriptions that are harder for screen reader users to navigate
- **Well-organized views** produce clear, focused descriptions that communicate effectively
- **Appropriate zoom levels** ensure the right level of detail for your audience

> **Tip:** Before generating, ask yourself: "If a sighted person looked at this view for 30 seconds, what would they understand?" That is what the AI will describe.

---

## Layer Visibility Checklist

The AI describes every visible layer in your current view. Managing which layers are on or off is one of the most important preparation steps.

### Turn ON:

- Primary thematic layers that communicate your map's purpose
- Key reference layers needed for context (major cities, boundaries)
- Any layer with data you want communicated to your audience
- Legend-relevant layers with meaningful symbology

### Turn OFF:

- Decorative or cosmetic layers that do not add information
- Redundant layers (e.g., both detailed and generalized versions of the same data)
- Reference layers not essential to understanding the map's message
- Operational or editing layers not meant for public display
- Layers that obscure more important information underneath

### Check Layer Order:

Layer stacking matters. Features on top can obscure features below:

- Place the most important layers on top
- Ensure critical features are not hidden by overlapping layers
- Consider transparency if multiple layers must overlap

> **Tip:** The AI will mention when layers overlap and create darker or harder-to-distinguish areas. If overlapping is intentional and meaningful, keep it. If it just creates visual noise, turn off one of the layers.

---

## Zoom Level Considerations

Accessible Map Agent produces **scale-aware descriptions**. The AI automatically adapts its description style based on your current zoom level, providing appropriate detail for the geographic extent you are showing.

### Recommended Zoom Levels by Purpose

| If You Want To Show... | Zoom To... | Description Focus |
|------------------------|------------|-------------------|
| National patterns and regional distribution | Country or state level | Regional patterns, state-level trends, overall distribution |
| Metropolitan comparisons and corridors | Regional level | County/city comparisons, metropolitan areas, transportation corridors |
| Neighborhood-level detail | City or local level | Specific neighborhoods, major landmarks, street-level clusters |
| Individual site characteristics | Street or parcel level | Specific buildings, intersections, site-level features |

### How Zoom Affects Descriptions

At **country-level zoom**, the AI might say:
> Service coverage is concentrated along the Atlantic coast and in major metropolitan regions, with gaps across the Mountain West.

At **city-level zoom**, the AI might say:
> The highest concentration of service sites appears in the downtown core near Pioneer Square, with secondary clusters in the Capitol Hill and University District neighborhoods.

### Choosing the Right Zoom Level

- Match your zoom level to your map's purpose
- Zoom in enough that key features are distinguishable
- Zoom out enough that overall patterns are visible (if patterns matter)
- Avoid zooming so far in that features are cut off or isolated from context
- Avoid zooming so far out that important details become indistinguishable

> **Tip:** If your map tells different stories at different scales, consider generating multiple descriptions at different zoom levels for interactive applications.

---

## Metadata That Helps

The AI reads your layer metadata to understand what visual elements represent. Good metadata leads to more accurate and meaningful descriptions.

### Layer Titles

Layer titles appear directly in the generated description. Compare these examples:

| Layer Title | Appears In Description As... |
|-------------|------------------------------|
| "Layer_1" | "Layer_1 features appear scattered across..." (unhelpful) |
| "Fire Stations" | "Fire Stations are distributed throughout the county..." (clear and useful) |

- Use descriptive, plain-language layer titles
- Avoid abbreviations, codes, or technical names
- Make titles understandable to someone unfamiliar with your organization

### Layer Descriptions

If your layers have descriptions in ArcGIS Online, the AI uses these to provide context:

- Add descriptions explaining what each layer represents
- Include units of measurement where relevant
- Note data timeframes if the data is time-sensitive

### Symbology Labels

The AI interprets your symbology and translates colors and symbols into words:

- Use meaningful classification labels (e.g., "High Risk", "Medium Risk", "Low Risk" rather than "1", "2", "3")
- Ensure legend values are human-readable
- Consider how color choices will be described (distinct colors are easier to differentiate than subtle gradients)

---

## Map Title Importance

Your map title is prominently featured in the generated description. A descriptive title helps the AI understand and communicate your map's purpose.

### Good Map Titles

These titles communicate what the map shows and why it matters:

- "Portland Tree Planting Priority Areas"
- "Fire Station Response Coverage - Denver Metro Area"
- "Census Tracts by Median Household Income, 2024"
- "Flood Risk Zones - Coastal Oregon"

### Generic Titles to Avoid

These titles do not help the AI understand your map's purpose:

- "My Map"
- "Test Map 2"
- "Copy of Project Data"
- "Untitled"

> **Tip:** If your map title is generic, consider renaming it in ArcGIS Online before generating a description. The title you set is the title that appears in your accessibility description.

---

## Common Mistakes to Avoid

### Too Many Layers Visible

**Problem:** Every visible layer gets described, creating long, unfocused descriptions.

**Solution:** Turn off layers that do not contribute to the map's primary message. A focused map produces a focused description.

### Zoomed Out Too Far

**Problem:** At very high zoom levels, individual features become indistinguishable, and the AI can only describe general patterns.

**Solution:** Zoom in enough that the features you want described are visually distinct and identifiable.

### Zoomed In Too Far

**Problem:** Individual features are visible but isolated from their geographic context. Patterns and relationships are lost.

**Solution:** Zoom out enough to show meaningful spatial relationships and patterns.

### Missing or Obscured Legend

**Problem:** Without visible symbology context, the AI must guess what colors and symbols mean.

**Solution:** Ensure your map has clear symbology that the AI can interpret. The AI reads layer metadata, but clear visual distinctions help.

### Unclear Symbology

**Problem:** Very similar colors (e.g., five shades of blue) or very small symbols are difficult to distinguish.

**Solution:** Use distinct colors and appropriately sized symbols. If you must use subtle gradients, ensure your layer descriptions explain the classification.

### Dense Overlapping Features

**Problem:** When many features overlap in the same area, individual features cannot be distinguished.

**Solution:** Consider turning off less important layers, adjusting transparency, or zooming in to reduce visual density.

### Sensitive Data in View

**Problem:** The AI describes what it sees. If sensitive data is visible, it may be included in the description.

**Solution:** Turn off any layers containing sensitive, confidential, or internal-only information before generating.

---

## Quick Checklist Before Generating

Use this checklist every time you prepare to generate a description:

### Layer Visibility
- Only essential layers are visible
- Key data layers are not obscured by other layers
- Decorative or redundant layers are turned off
- No sensitive data is visible in the current view

### Zoom and Extent
- Zoom level matches the story you want to tell
- Important features are centered and fully visible
- Scale provides appropriate level of detail for your audience

### Metadata
- Layer titles are descriptive and clear
- Layer descriptions provide context (if available)
- Symbology classifications are human-readable

### Final Preview
- The map view looks how you want it described
- A sighted viewer would understand the map's purpose from this view

---

## What Happens Next

After you click "Generate Description," the AI will:

1. Capture a screenshot of your exact current view
2. Read your layer metadata (titles, descriptions, symbology)
3. Identify your zoom level and geographic center
4. Analyze the visual patterns, colors, and features in the image
5. Generate a structured, accessible description

The description will appear in real-time as it is generated, typically taking 15-30 seconds depending on map complexity.

> **Tip:** If your first description does not capture what you wanted, adjust your map view and generate again. Often, small changes to zoom level or layer visibility make a significant difference in output quality.

---

*For guidance on integrating your generated description into your applications, see [Using Your Description](/help/using-your-description).*
