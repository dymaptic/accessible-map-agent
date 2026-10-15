export interface DemoExample {
  id: string;
  title: string;
  category: string;
  webMapId: string;
  extent?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    spatialReference: { wkid: number };
  };
  description: string;
}

const PORTLAND_DESCRIPTION = `## MAP SUMMARY

**Map Title:** Portland Tree Planting Priority Areas

**Purpose:** This map identifies geographic areas within and around Portland, Oregon that would benefit most from additional tree planting. The analysis integrates three critical factors: heat wave risk at the census tract level, surface-level heat severity (measured 1–5 scale), and existing tree coverage.

**Geographic Extent:** Regional view centered on Portland, Oregon and surrounding metropolitan area. The map covers approximately 219 miles east-west and 189 miles north-south at a 1:1,155,581 scale.

---

## KEY TRENDS AND PATTERNS

Heat severity shows significant urban-rural disparity, with the highest temperatures concentrated in Portland's urban core, particularly in East Portland, Northeast Portland, and industrial areas along the Willamette River. The coastal counties consistently show the lowest heat severity values, benefiting from maritime climate moderation.

## LANDMARKS

### Major Jurisdictional Boundaries

**Portland City Boundary (white polygon with black outline):**
- Central feature of the map
- Located in northwest Oregon, east of the Coast Range
- Bounded by the Columbia River to the north

**Visible Counties:**
- **Clatsop County** (northwest corner): Low heat severity (yellow)
- **Columbia County** (north-central): Mixed orange to red heat severity
- **Washington County** (west of Portland): Predominantly orange heat severity
- **Multnomah County** (contains Portland): High variability—red and orange patches

---

## COMPLIANCE METADATA

**Accessibility Standards Met:**
- ADA Title II (April 2026) – Non-visual equivalent provided
- WCAG 2.1 § 1.1.1 Non-Text Content (Level AA)

#MapALT #ADA_TitleII #UrbanHeatIsland #TreePlanting #Portland`;

const MINNESOTA_DESCRIPTION = `## MAP SUMMARY

**Minnesota Wind Turbines and Typical Wind Speeds**

This map displays the spatial distribution of wind-powered electric generating facilities across Minnesota, overlaid on modeled annual average wind speed data from 2012. Wind turbines are represented by magenta turbine icons, with numeric labels indicating wind speeds in meters per second (m/s).

**Primary Purpose:** To visualize where operable wind power plants are located relative to typical wind speeds for renewable energy planning.

**Geographic Extent:** Minnesota, United States

---

## KEY TRENDS AND PATTERNS

Wind facilities are not uniformly distributed across Minnesota. The highest concentration appears in southwestern Minnesota near the Iowa and South Dakota borders, with a secondary concentration along the western border in the Fargo corridor. These locations correlate strongly with areas showing wind speeds of 3–5 m/s.

## LANDMARKS

### Wind Turbine Clusters

**Southwestern Minnesota (highest concentration):**
- 10–15 magenta turbine icons
- Located near South Dakota and Iowa borders
- Wind speeds: 3–5 m/s

**Western Corridor (Fargo area):**
- 6–10 turbine icons along North Dakota border
- Follows Red River Valley

### Major Cities (Reference Points)
- **Minneapolis-St. Paul:** No turbines in metro core
- **Duluth:** Limited turbines in northeast
- **Rochester:** Some turbines in southeast quadrant

---

## COMPLIANCE METADATA

**Accessibility Standards:**
- ADA Title II – web content accessibility compliance
- WCAG 2.1 Success Criterion 1.1.1 (Non-Text Content, Level AA)

#MapALT #RenewableEnergy #WindEnergy #Minnesota`;

const FLORIDA_DESCRIPTION = `## MAP SUMMARY

**Florida Climate Impact – Justice40 Initiative**

This map displays Justice40 Initiative data for the state of Florida, identifying census tracts classified as Disadvantaged, Partially Disadvantaged, or Not Disadvantaged according to federal Climate and Economic Justice Screening Tool (CEJST) criteria.

**Geographic Area:** Florida, United States
**Thematic Focus:** Environmental justice and climate investment targeting

---

## KEY TRENDS AND PATTERNS

Florida displays a heterogeneous distribution of disadvantaged communities. Disadvantaged tracts (dark blue) are concentrated in select urban cores, coastal areas, and rural inland regions—particularly in central Miami, Tampa-St. Petersburg, Orlando, and Jacksonville. Most major cities exhibit a "bulls-eye" pattern: dark blue Disadvantaged tracts in the center, surrounded by rings of light blue Partially Disadvantaged tracts.

## LEGEND DEFINITIONS

| Color | Classification | Description |
|-------|----------------|-------------|
| Dark Blue | Disadvantaged | Meets federal burden thresholds |
| Light Blue | Partially Disadvantaged | Partial overlap with criteria |
| White | Not Disadvantaged | Does not meet criteria |

## LANDMARKS

### Major Urban Centers with Disadvantaged Concentrations
- **Miami** (southeast): Concentrated dark blue tracts in urban core
- **Tampa / St. Petersburg** (west-central): Extensive dark blue in urban cores
- **Orlando** (central): Significant concentration in central zones
- **Jacksonville** (northeast): Mix of disadvantaged tracts in urban areas

---

## COMPLIANCE METADATA

**Standards:**
- ADA Title II (effective April 2026)
- WCAG 2.1 § 1.1.1 Non-Text Content (Level AA)

#MapALT #Justice40 #EnvironmentalJustice #Florida`;

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: "portland-tree-planting",
    title: "Portland Tree Planting Priority Areas",
    category: "Environmental",
    webMapId: "862ebcbbd2724c61b216f948caaec706",
    description: PORTLAND_DESCRIPTION,
  },
  {
    id: "minnesota-wind-turbines",
    title: "Minnesota Wind Turbines",
    category: "Energy",
    webMapId: "b0018c9fedf34dc08a3369287920aa77",
    description: MINNESOTA_DESCRIPTION,
  },
  {
    id: "florida-climate",
    title: "Florida Climate & Justice40",
    category: "Environmental Justice",
    webMapId: "4505216385414298bf80f3dd5a0336c9",
    description: FLORIDA_DESCRIPTION,
  },
];
