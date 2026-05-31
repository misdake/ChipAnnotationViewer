# Annotation JSON Format

Annotation JSON is versioned independently from the application package version.
Newly saved annotations use the current `version` from
`ts/data/Annotation.ts`.

## Version 1

Version 1 is the legacy format. It has no root `version` field. Colors and alpha
values are stored as preset names, for example:

```json
{
  "texts": [
    {
      "colorName": "white",
      "alphaName": "100"
    }
  ]
}
```

## Version 2

Version 2 stores colors as unsigned packed RGBA integers using the
`0xRRGGBBAA` layout:

```json
{
  "version": 2,
  "texts": [
    {
      "color": 4294967295
    }
  ]
}
```

Polyline fill and stroke colors use the same representation through
`fillColor` and `strokeColor`.

## Adding A Version

1. Increment `ANNOTATION_DATA_VERSION` in `ts/data/Annotation.ts`.
2. Add an `upgradeVnToVnPlus1` function in
   `ts/data/AnnotationDataUpgrade.ts`.
3. Register the function in the `upgrades` map.
4. Keep each upgrade responsible for exactly one version step.
