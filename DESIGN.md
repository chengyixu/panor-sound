---
version: alpha
name: Soundscape Turntable
description: Quiet physical materiality for a responsive field-recording turntable.
colors:
  primary: "#080706"
  secondary: "#B9A98D"
  tertiary: "#D5CEC2"
  neutral: "#F5F5F2"
  muted: "#9E978C"
typography:
  title:
    fontFamily: Inter
    fontSize: 5.3rem
    fontWeight: 750
    lineHeight: 0.9
    letterSpacing: "-0.065em"
  metadata:
    fontFamily: Inter
    fontSize: 0.76rem
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0em"
  state:
    fontFamily: Inter
    fontSize: 0.66rem
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.13em"
rounded:
  compact: 18px
  control: 999px
spacing:
  compact: 8px
  stage: 24px
  safe: 16px
components:
  turntable-surface:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.compact}"
    padding: "{spacing.compact}"
  control:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.control}"
    padding: 10px
  queue-item-muted:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: 8px
---

## Overview

The Soundscape player should feel like a quiet, contemporary turntable rather than a decorative music widget. The vinyl, tonearm, cartridge, queue, and metadata share one geometric system. Nothing may overlap accidentally, and every visual movement must correspond to audio state or direct user input.

## Colors

- **Primary:** Near-black deck and platter surfaces.
- **Secondary:** Warm paper/brass label and playback accent.
- **Tertiary:** Brushed-metal tonearm and high-emphasis metadata.
- **Neutral:** Primary text and focus affordances.
- **Muted:** Descriptions, inactive queue items, and secondary state copy.

## Typography

Titles are large but bounded to the metadata column. Creator and location form one compact byline. State copy remains small, uppercase, and paired with a physical status dot rather than becoming a second headline.

## Layout

Desktop uses one two-column body: the turntable stage and the metadata column. Mobile stacks the stage above metadata. The record may crop beyond the stage edge, but the tonearm, queue labels, controls, and metadata must remain inside the viewport and safe areas.

The queue follows a concave path on the playable groove. Its outer labels move inward and rotate slightly; the active row remains centered and horizontal. Queue labels must never cross the tonearm interaction area.

## Elevation & Depth

Depth comes from restrained material highlights, inset platter shading, and soft shadows. Avoid neon glows, exaggerated blur, and floating glass cards inside the focused player.

## Shapes

The tonearm is a single transform hierarchy: pivot → moving arm → cartridge head → needle. The cartridge may never be positioned as an unrelated sibling. Controls use pill or circular geometry with at least 44 CSS pixels of pointer area.

## Components

The compact player is a miniaturized version of the focused player, not a separate icon language. It shows the same record material, connected arm, title, creator, and location. Vinyl rotates only while playback is active; parking the needle pauses both audio and rotation.

## Do's and Don'ts

- Do animate only transform, opacity, and audio volume during normal interaction.
- Do preserve real backend titles, creators, locations, descriptions, and audio URLs.
- Do verify desktop and 390×844 geometry for every player state.
- Don't position record, arm, queue, and metadata with unrelated viewport offsets.
- Don't let queue labels become a plain horizontal or vertical list.
- Don't add decorative rotating platter parts, neon accents, or placeholder metadata.
